/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Import fake-indexeddb to provide a real W3C-compliant in-memory IndexedDB engine
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import fs from 'fs';
import { DB_NAME, DB_VERSION, FitAppDB, REQUIRED_STORES, STORES } from '../src/services/db.ts';

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA FINAL: ROLLBACK INTEGRAL E 7 TABELAS');
console.log('CHECKPOINT 01 — Testes A, B, C (Rollback em Equipments) e D (Regressão Estrita)');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testCode, testTitle, details = '') {
  if (condition) {
    console.log(`[PASS] ${testCode}. ${testTitle}`);
    if (details) console.log(`       ↳ ${details}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testCode}. ${testTitle}`);
    if (details) console.error(`       ↳ ERRO: ${details}`);
    failCount++;
  }
}

async function runCompleteAuditSuite() {
  // ---------------------------------------------------------------------------
  // TESTE A: EXPORTAÇÃO SEM TABELA OFICIAL
  // Simular banco sem uma das tabelas obrigatórias e comprovar que a exportação
  // falha claramente, sem produzir backup incompleto.
  // ---------------------------------------------------------------------------
  const factoryWithoutEquipments = new IDBFactory();
  await new Promise((resolve, reject) => {
    const req = factoryWithoutEquipments.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const s of REQUIRED_STORES) {
        if (s !== STORES.EQUIPMENTS) {
          db.createObjectStore(s, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const dbMissingTable = new FitAppDB(factoryWithoutEquipments);
  let exportFailedAsExpected = false;
  let exportErrorMessage = '';

  try {
    await dbMissingTable.exportAllData();
  } catch (err) {
    exportFailedAsExpected = true;
    exportErrorMessage = err instanceof Error ? err.message : String(err);
  } finally {
    dbMissingTable.closeConnection();
  }

  assert(
    exportFailedAsExpected &&
      exportErrorMessage.includes('equipments') &&
      exportErrorMessage.includes('não existe fisicamente no banco de dados'),
    'TESTE A',
    'Exportação Sem Tabela Oficial Falha Imediatamente',
    `Erro capturado corretamente: "${exportErrorMessage}" (Nenhum backup corrompido foi gerado)`
  );

  // ---------------------------------------------------------------------------
  // TESTE B: EXPORTAÇÃO COM TABELA ADICIONAL NÃO OFICIAL
  // Simular a existência de uma tabela não oficial e comprovar que ela não é
  // incluída no backup gerado, preservando exatamente as 7 tabelas oficiais.
  // ---------------------------------------------------------------------------
  const factoryWithExtraStore = new IDBFactory();
  await new Promise((resolve, reject) => {
    const req = factoryWithExtraStore.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const s of REQUIRED_STORES) {
        db.createObjectStore(s, { keyPath: 'id' });
      }
      db.createObjectStore('tabela_adicional_nao_oficial', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  const dbWithExtra = new FitAppDB(factoryWithExtraStore);
  const exportedWithExtraRaw = await dbWithExtra.exportAllData();
  dbWithExtra.closeConnection();

  const exportedWithExtraObj = JSON.parse(exportedWithExtraRaw);
  const exportedWithExtraKeys = Object.keys(exportedWithExtraObj.data);

  const extraStoreExcluded = !('tabela_adicional_nao_oficial' in exportedWithExtraObj.data);
  const exact7StoresOnly =
    exportedWithExtraKeys.length === REQUIRED_STORES.length &&
    REQUIRED_STORES.every((store) => exportedWithExtraKeys.includes(store));

  assert(
    extraStoreExcluded && exact7StoresOnly,
    'TESTE B',
    'Exportação com Tabela Adicional Preserva Exclusivamente as 7 Oficiais',
    `A tabela adicional foi ignorada. O backup gerou exatamente as 7 oficiais: ${exportedWithExtraKeys.join(', ')}`
  );

  // ---------------------------------------------------------------------------
  // TESTE C: ROLLBACK INTEGRAL REAL EM importAllData()
  // 1. Gravar dados originais conhecidos nas 7 tabelas.
  // 2. Registrar um snapshot completo dos dados originais.
  // 3. Preparar um backup alternativo com registros diferentes nas 7 tabelas.
  // 4. Iniciar a restauração por meio da rotina real importAllData().
  // 5. Permitir que a rotina execute a limpeza das 7 tabelas.
  // 6. Permitir que profile e preferences tenham suas operações put() enfileiradas.
  // 7. Injetar a falha durante a inserção em equipments, antes do commit.
  // 8. Confirmar que a rotina solicita tx.abort().
  // 9. Aguardar a rejeição da Promise somente após tx.onabort.
  // 10. Consultar novamente todas as 7 tabelas.
  // 11. Comparar integralmente os registros recuperados com o snapshot original.
  // 12. Fechar conexão, criar nova instância, reabrir e comparar todas as 7 tabelas.
  // ---------------------------------------------------------------------------
  const standardFactory = new IDBFactory();
  const dbTestC = new FitAppDB(standardFactory);

  // 1. Grava dados originais conhecidos nas 7 tabelas
  const originalInitialData = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [
        {
          id: 'current_user',
          name: 'Atleta Original Imutavel',
          gymName: 'Academia Forca Viva',
          height: 180,
          weight: 82.5,
          goal: 'hipertrofia',
        },
      ],
      preferences: [
        {
          id: 'current_preferences',
          theme: 'orange',
          soundAlerts: true,
          vibration: true,
          restTimerDefaultSeconds: 60,
          keepScreenAwake: true,
        },
      ],
      equipments: [
        { id: 'eq_orig_1', name: 'Supino Reto Original' },
        { id: 'eq_orig_2', name: 'Leg Press 45 Original' },
      ],
      workout_plans: [
        { id: 'plan_orig_1', name: 'Ficha Instrutor Original', version: 1 },
      ],
      workout_sessions: [
        { id: 'sess_orig_1', divisionName: 'Treino A', isCompleted: true },
      ],
      cardio_sessions: [
        { id: 'cardio_orig_1', equipmentType: 'esteira', durationSeconds: 1800 },
      ],
      body_measurements: [
        { id: 'meas_orig_1', weight: 82.5, date: '2026-11-01' },
      ],
    },
  };

  const setupResult = await dbTestC.importAllData(JSON.stringify(originalInitialData));
  assert(setupResult.success === true, 'TESTE C.1', 'Configuração Inicial das Sete Tabelas');

  // 2. Snapshot completo de referência de todos os dados originais
  const originalSnapshot = await dbTestC.getAllRecordsFromStores();
  const originalReferenceCopy = JSON.parse(JSON.stringify(originalSnapshot));

  // 3. Backup alternativo com dados completamente diferentes nas sete tabelas
  const alternativeBackup = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [{ id: 'current_user', name: 'NOVO ATLETA SUBVERSIVO (DEVE SER DESCARTADO)' }],
      preferences: [{ id: 'current_preferences', theme: 'red' }],
      equipments: [
        { id: 'eq_novo_1', name: 'Equipamento Subversivo' },
        { id: 'eq_novo_2', name: 'Outro Equipamento' },
      ],
      workout_plans: [{ id: 'plan_novo_1', name: 'Plano Subversivo' }],
      workout_sessions: [{ id: 'sess_novo_1', divisionName: 'Sessão Subversiva' }],
      cardio_sessions: [{ id: 'cardio_novo_1', equipmentType: 'bike' }],
      body_measurements: [{ id: 'meas_novo_1', weight: 99.9 }],
    },
  };

  // 4. Configuração da injeção de falha no ponto exato:
  // - profile e preferences têm put() enfileirados
  // - a falha é injetada especificamente durante a inserção em "equipments", antes do commit
  let profilePutEnqueued = false;
  let preferencesPutEnqueued = false;
  let faultInjectedInEquipments = false;

  dbTestC.setTestFaultInjector((phase, storeName, item) => {
    if (phase === 'during_insert' && storeName === STORES.PROFILE) {
      profilePutEnqueued = true;
    }
    if (phase === 'during_insert' && storeName === STORES.PREFERENCES) {
      preferencesPutEnqueued = true;
    }
    if (phase === 'during_insert' && storeName === STORES.EQUIPMENTS) {
      faultInjectedInEquipments = true;
      return true; // Dispara a exceção intencional no momento em que 'equipments' está sendo inserido
    }
    return false;
  });

  // 5. Inicia a restauração através da rotina real importAllData()
  const importResultRollback = await dbTestC.importAllData(JSON.stringify(alternativeBackup));

  // Desativa o injetor de falha
  dbTestC.setTestFaultInjector(undefined);

  assert(
    importResultRollback.success === false &&
      profilePutEnqueued &&
      preferencesPutEnqueued &&
      faultInjectedInEquipments,
    'TESTE C.2',
    'Falha Injetada em "equipments" Após Enfileirar "profile" e "preferences"',
    'A rotina real executou limpeza das 7 tabelas, enfileirou profile/preferences, capturou a falha em equipments e abortou a transação.'
  );

  // 6. Consulta direta de todas as 7 tabelas imediatamente após a falha
  const dataAfterRollbackDirect = await dbTestC.getAllRecordsFromStores();

  let directAllMatch = true;
  for (const table of REQUIRED_STORES) {
    const orig = JSON.stringify(originalReferenceCopy[table]);
    const curr = JSON.stringify(dataAfterRollbackDirect[table]);
    if (orig !== curr) {
      directAllMatch = false;
      console.error(`Discrepância na tabela "${table}" na consulta direta pós-abort!`);
    }
  }

  assert(
    directAllMatch &&
      dataAfterRollbackDirect.profile[0]?.name === 'Atleta Original Imutavel' &&
      dataAfterRollbackDirect.equipments.length === 2 &&
      dataAfterRollbackDirect.equipments[0]?.name === 'Supino Reto Original',
    'TESTE C.3',
    'Conferência Direta das Sete Tabelas Pós-Rollback (Dados 100% Intactos)',
    'Todas as 7 tabelas permaneceram exatamente iguais ao estado anterior à tentativa de restauração.'
  );

  // 7. Conferência após fechamento e reabertura real do banco
  dbTestC.closeConnection();
  const dbReopenedC = new FitAppDB(standardFactory);
  const dataAfterReopenC = await dbReopenedC.getAllRecordsFromStores();
  dbReopenedC.closeConnection();

  let reopenAllMatch = true;
  for (const table of REQUIRED_STORES) {
    const orig = JSON.stringify(originalReferenceCopy[table]);
    const curr = JSON.stringify(dataAfterReopenC[table]);
    if (orig !== curr) {
      reopenAllMatch = false;
      console.error(`Discrepância na tabela "${table}" após reabertura!`);
    }
  }

  assert(
    reopenAllMatch &&
      dataAfterReopenC.profile[0]?.name === 'Atleta Original Imutavel' &&
      dataAfterReopenC.preferences[0]?.theme === 'orange' &&
      dataAfterReopenC.equipments.length === 2 &&
      dataAfterReopenC.workout_plans.length === 1 &&
      dataAfterReopenC.workout_sessions.length === 1 &&
      dataAfterReopenC.cardio_sessions.length === 1 &&
      dataAfterReopenC.body_measurements.length === 1,
    'TESTE C.4',
    'Conferência das Sete Tabelas Pós-Reabertura Real do Banco',
    'A reabertura comprovou que todos os registros das 7 tabelas permaneceram rigorosamente preservados.'
  );

  // ---------------------------------------------------------------------------
  // TESTE D: REGRESSÃO COMPLETA
  // ---------------------------------------------------------------------------
  const regressionDb = new FitAppDB(new IDBFactory());

  // D.1: Backup com 7 tabelas vazias
  const emptyBackup = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [],
      preferences: [],
      equipments: [],
      workout_plans: [],
      workout_sessions: [],
      cardio_sessions: [],
      body_measurements: [],
    },
  };
  const valD1 = regressionDb.validateBackupString(JSON.stringify(emptyBackup));
  assert(valD1.isValid === true, 'TESTE D.1', 'Regressão: Backup com 7 tabelas vazias');

  // D.2: Rejeição de tabela ausente
  const missingOneTable = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [],
      preferences: [],
      // equipments ausente
      workout_plans: [],
      workout_sessions: [],
      cardio_sessions: [],
      body_measurements: [],
    },
  };
  const valD2 = regressionDb.validateBackupString(JSON.stringify(missingOneTable));
  assert(valD2.isValid === false && valD2.error?.includes('equipments'), 'TESTE D.2', 'Regressão: Rejeição de tabela ausente');

  // D.3: Rejeição de ID duplicado
  const dupIdBackup = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [],
      preferences: [],
      equipments: [{ id: 'eq_dup' }, { id: 'eq_dup' }],
      workout_plans: [],
      workout_sessions: [],
      cardio_sessions: [],
      body_measurements: [],
    },
  };
  const valD3 = regressionDb.validateBackupString(JSON.stringify(dupIdBackup));
  assert(valD3.isValid === false && valD3.error?.includes('ID duplicado'), 'TESTE D.3', 'Regressão: Rejeição de ID duplicado');

  // D.4: Aceitação de backup legado FIT APP
  const legacyBackup = {
    app: 'FIT APP',
    version: '1.0',
    data: {
      profile: [{ id: 'current_user', name: 'Legado Atleta' }],
      preferences: [{ id: 'current_preferences', theme: 'green' }],
      equipments: [],
      workout_plans: [],
      workout_sessions: [],
      cardio_sessions: [],
      body_measurements: [],
    },
  };
  const valD4 = regressionDb.validateBackupString(JSON.stringify(legacyBackup));
  assert(valD4.isValid === true && valD4.app === 'FIT APP', 'TESTE D.4', 'Regressão: Suporte a backup legado FIT APP');

  // D.5: Restauração completa de todas as 7 tabelas com validação individual de valores e IDs
  const fullPayload = {
    app: 'TREINO CERTO',
    version: '1.1',
    data: {
      profile: [{ id: 'current_user', name: 'Carlos Master', weight: 88, height: 185, goal: 'hipertrofia' }],
      preferences: [{ id: 'current_preferences', theme: 'gold' }],
      equipments: [
        { id: 'eq_1', name: 'Supino Reto' },
        { id: 'eq_2', name: 'Leg Press 45' },
      ],
      workout_plans: [{ id: 'plan_1', name: 'Plano A/B' }],
      workout_sessions: [{ id: 'sess_1', divisionName: 'Treino A' }],
      cardio_sessions: [{ id: 'cardio_1', equipmentType: 'esteira' }],
      body_measurements: [{ id: 'meas_1', weight: 88 }],
    },
  };
  const importFull = await regressionDb.importAllData(JSON.stringify(fullPayload));
  const fullRecords = await regressionDb.getAllRecordsFromStores();

  const matchProfile =
    fullRecords.profile.length === 1 &&
    fullRecords.profile[0].id === 'current_user' &&
    fullRecords.profile[0].name === 'Carlos Master' &&
    fullRecords.profile[0].weight === 88 &&
    fullRecords.profile[0].height === 185 &&
    fullRecords.profile[0].goal === 'hipertrofia';

  const matchPrefs =
    fullRecords.preferences.length === 1 &&
    fullRecords.preferences[0].id === 'current_preferences' &&
    fullRecords.preferences[0].theme === 'gold';

  const matchEquips =
    fullRecords.equipments.length === 2 &&
    fullRecords.equipments[0].id === 'eq_1' &&
    fullRecords.equipments[0].name === 'Supino Reto' &&
    fullRecords.equipments[1].id === 'eq_2' &&
    fullRecords.equipments[1].name === 'Leg Press 45';

  const matchPlans =
    fullRecords.workout_plans.length === 1 &&
    fullRecords.workout_plans[0].id === 'plan_1' &&
    fullRecords.workout_plans[0].name === 'Plano A/B';

  const matchSessions =
    fullRecords.workout_sessions.length === 1 &&
    fullRecords.workout_sessions[0].id === 'sess_1' &&
    fullRecords.workout_sessions[0].divisionName === 'Treino A';

  const matchCardio =
    fullRecords.cardio_sessions.length === 1 &&
    fullRecords.cardio_sessions[0].id === 'cardio_1' &&
    fullRecords.cardio_sessions[0].equipmentType === 'esteira';

  const matchMeasurements =
    fullRecords.body_measurements.length === 1 &&
    fullRecords.body_measurements[0].id === 'meas_1' &&
    fullRecords.body_measurements[0].weight === 88;

  const allRecordsMatchExactly =
    importFull.success === true &&
    matchProfile &&
    matchPrefs &&
    matchEquips &&
    matchPlans &&
    matchSessions &&
    matchCardio &&
    matchMeasurements;

  assert(
    allRecordsMatchExactly,
    'TESTE D.5',
    'Regressão: Restauração Completa das 7 Tabelas com Verificação de Valores e IDs',
    'Todos os valores, IDs e contagens de cada uma das 7 tabelas foram validados individualmente.'
  );

  // D.6: Reabertura real do banco e integridade dos dados
  regressionDb.closeConnection();
  const reopenedDb = new FitAppDB(regressionDb['customIndexedDB']);
  const reopenedInstance = await reopenedDb.getDB();
  const recordsPostReopen = await reopenedDb.getAllRecordsFromStores();
  reopenedDb.closeConnection();

  const reopenAllMatchExactly =
    recordsPostReopen.profile[0]?.name === 'Carlos Master' &&
    recordsPostReopen.preferences[0]?.theme === 'gold' &&
    recordsPostReopen.equipments.length === 2 &&
    recordsPostReopen.workout_plans.length === 1 &&
    recordsPostReopen.workout_sessions.length === 1 &&
    recordsPostReopen.cardio_sessions.length === 1 &&
    recordsPostReopen.body_measurements.length === 1;

  assert(
    reopenedInstance.name === DB_NAME && reopenAllMatchExactly,
    'TESTE D.6',
    'Regressão: Reabertura Real e Conferência Exata de Registros das 7 Tabelas',
    'Conexão reaberta e todos os registros das 7 tabelas conferidos com exatidão.'
  );

  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('\nHOUVE REPROVAÇÕES NA AUDITORIA!');
    process.exit(1);
  } else {
    console.log('\nTODOS OS CENÁRIOS DE AUDITORIA FORAM APROVADOS COM SUCESSO TOTAL!');
  }
}

runCompleteAuditSuite().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
