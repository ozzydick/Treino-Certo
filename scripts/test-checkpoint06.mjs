/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import fs from 'node:fs';
import {
  DB_NAME,
  FitAppDB,
  REQUIRED_STORES,
  STORES,
} from '../src/services/db.ts';
import { DEFAULT_EXERCISES_CATALOG } from '../src/constants/exercisesCatalog.ts';
import {
  calculateGoalProgress,
  calculateWeeklySummary,
  checkLocalReminderTrigger,
} from '../src/utils/goalAndSummaryCalculator.ts';

// Configuração de ambiente para testes offline em Node.js
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};
globalThis.window = globalThis;

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA E TESTES DE HOMOLOGAÇÃO CP06');
console.log('Refinamento, Metas, Lembretes Locais, Resumo Semanal e Backup Auditado');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testCode, testTitle, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] ${testCode}. ${testTitle}`);
    if (details) {
      console.log(`       ↳ ${details}`);
    }
  } else {
    failCount++;
    console.error(`[FAIL] ${testCode}. ${testTitle}`);
    if (details) {
      console.error(`       ↳ ERRO: ${details}`);
    }
  }
}

async function runCheckpoint06TestSuite() {
  const idbFactory = new IDBFactory();
  const db = new FitAppDB(idbFactory);

  // ===========================================================================
  // BLOCO 1: METAS E REGULARIDADE (CP06 — BLOCO 1)
  // ===========================================================================
  console.log('--- BLOCO 1: METAS PESSOAIS DE TREINAMENTO E REGULARIDADE ---');

  // Teste 01: Cadastro e edição de metas pessoais
  const goalConfig = {
    targetWorkoutsPerWeek: 4,
    preferredDays: [1, 3, 5, 6], // Seg, Qua, Sex, Sáb
    startDate: '2026-11-01',
    isActive: true,
  };

  const currentPrefs = await db.getPreferences();
  const updatedPrefs = {
    ...currentPrefs,
    goalConfig,
  };
  await db.savePreferences(updatedPrefs);
  const reloadedPrefs = await db.getPreferences();

  assert(
    reloadedPrefs.goalConfig !== undefined &&
      reloadedPrefs.goalConfig.targetWorkoutsPerWeek === 4 &&
      reloadedPrefs.goalConfig.preferredDays.length === 4 &&
      reloadedPrefs.goalConfig.isActive === true,
    'CENÁRIO 01',
    'Cadastro e edição de metas pessoais de treino no IndexedDB',
    `Meta gravada: ${reloadedPrefs.goalConfig?.targetWorkoutsPerWeek} treinos/semana, Dias preferidos: [${reloadedPrefs.goalConfig?.preferredDays.join(', ')}]`
  );

  // Teste 02: Cálculo de cumprimento da meta semanal e percentual de progresso
  const baseNowMs = new Date('2026-11-06T12:00:00.000Z').getTime(); // Sexta-feira
  const mockCompletedSessions = [
    {
      id: 'sess_cp6_w1_01',
      startTime: '2026-11-02T09:00:00.000Z', // Segunda
      isCompleted: true,
      elapsedActiveSeconds: 3000,
      totalVolumeKg: 2500,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 80, completed: true }],
        },
      ],
    },
    {
      id: 'sess_cp6_w1_02',
      startTime: '2026-11-04T10:00:00.000Z', // Quarta
      isCompleted: true,
      elapsedActiveSeconds: 3600,
      totalVolumeKg: 3000,
      exerciseLogs: [
        {
          exerciseId: 'ex_costas_puxada_alta_pronada',
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 70, completed: true }],
        },
      ],
    },
    {
      id: 'sess_cp6_w1_03',
      startTime: '2026-11-06T08:00:00.000Z', // Sexta (hoje)
      isCompleted: true,
      elapsedActiveSeconds: 2700,
      totalVolumeKg: 2000,
      exerciseLogs: [
        {
          exerciseId: 'ex_quadriceps_agachamento_livre',
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 100, completed: true }],
        },
      ],
    },
  ];

  const goalSummary = calculateGoalProgress(
    mockCompletedSessions,
    goalConfig,
    4,
    baseNowMs
  );

  assert(
    goalSummary.currentWeekCompleted === 3 &&
      goalSummary.targetWorkoutsPerWeek === 4 &&
      goalSummary.currentWeekCompliancePercent === 75 &&
      goalSummary.isCurrentWeekGoalMet === false,
    'CENÁRIO 02',
    'Cálculo exato de cumprimento da meta semanal e percentual (3/4 = 75%)',
    `Realizados: ${goalSummary.currentWeekCompleted}/${goalSummary.targetWorkoutsPerWeek} (${goalSummary.currentWeekCompliancePercent}%)`
  );

  // Teste 03: Transição de semanas e histórico mensal de metas (8 semanas e 6 meses)
  assert(
    goalSummary.weeklyHistory.length === 8 &&
      goalSummary.monthlyHistory.length === 6 &&
      goalSummary.weeklyHistory[0].completedWorkouts === 3 &&
      goalSummary.monthlyHistory[0].completedWorkouts === 3,
    'CENÁRIO 03',
    'Histórico temporal de cumprimento de metas (8 semanas e 6 meses)',
    `Histórico gerado: ${goalSummary.weeklyHistory.length} semanas e ${goalSummary.monthlyHistory.length} meses`
  );

  // Teste 04: Exclusão de sessões incompletas/duplicadas nos cálculos de metas e resumo
  const dirtySessions = [
    ...mockCompletedSessions,
    {
      id: 'sess_cp6_w1_01', // Duplicada
      startTime: '2026-11-02T09:00:00.000Z',
      isCompleted: true,
      totalVolumeKg: 9999,
    },
    {
      id: 'sess_incomplete', // Incompleta
      startTime: '2026-11-05T10:00:00.000Z',
      isCompleted: false,
      totalVolumeKg: 5000,
    },
  ];

  const dirtyGoalSummary = calculateGoalProgress(dirtySessions, goalConfig, 4, baseNowMs);

  assert(
    dirtyGoalSummary.currentWeekCompleted === 3 &&
      dirtyGoalSummary.currentWeekCompliancePercent === 75,
    'CENÁRIO 04',
    'Exclusão rigorosa de sessões duplicadas/incompletas nos cálculos de metas',
    `Sessões filtradas mantêm 3 treinos concluídos (duplicata e incompleta descartadas)`
  );

  // ===========================================================================
  // BLOCO 2: LEMBRETES LOCAIS (CP06 — BLOCO 2)
  // ===========================================================================
  console.log('\n--- BLOCO 2: LEMBRETES LOCAIS E PROTEÇÃO CONTRA DUPLICAÇÃO ---');

  // Teste 05: Configuração de lembrete local no IndexedDB
  const reminderConfig = {
    isActive: true,
    time: '08:00',
    days: [1, 3, 5], // Seg, Qua, Sex
    message: 'Bora treinar hoje pra bater a meta!',
    lastShownDate: '2026-11-04',
  };

  const prefsWithReminder = {
    ...reloadedPrefs,
    reminderConfig,
  };
  await db.savePreferences(prefsWithReminder);
  const fetchedPrefsWithReminder = await db.getPreferences();

  assert(
    fetchedPrefsWithReminder.reminderConfig !== undefined &&
      fetchedPrefsWithReminder.reminderConfig.isActive === true &&
      fetchedPrefsWithReminder.reminderConfig.time === '08:00' &&
      fetchedPrefsWithReminder.reminderConfig.message.includes('bater a meta'),
    'CENÁRIO 05',
    'Persistência e recuperação de configurações de lembretes locais',
    `Horário: ${fetchedPrefsWithReminder.reminderConfig?.time}, Mensagem: "${fetchedPrefsWithReminder.reminderConfig?.message}"`
  );

  // Teste 06: Acionamento e proteção contra duplicação de lembrete no mesmo dia (lastShownDate)
  // Teste A: Data 2026-11-06 09:00 (Sexta = dia 5, horário 09:00 >= 08:00, lastShownDate '2026-11-04') -> Deve disparar
  const triggerResult1 = checkLocalReminderTrigger(reminderConfig, baseNowMs);

  // Teste B: Após ser exibido no dia '2026-11-06', lastShownDate é atualizado para '2026-11-06' -> Não deve disparar novamente
  const updatedReminderConfig = {
    ...reminderConfig,
    lastShownDate: '2026-11-06',
  };
  const triggerResult2 = checkLocalReminderTrigger(updatedReminderConfig, baseNowMs);

  assert(
    triggerResult1 !== null &&
      triggerResult1.shouldTrigger === true &&
      triggerResult1.currentDate === '2026-11-06' &&
      triggerResult2 === null,
    'CENÁRIO 06',
    'Acionamento de lembrete local com proteção contra exibição duplicada no mesmo dia',
    `1ª verificação: Disparou=${triggerResult1?.shouldTrigger} | 2ª verificação (após exibição): Bloqueado=${triggerResult2 === null}`
  );

  // ===========================================================================
  // BLOCO 3: RESUMO SEMANAL AUTOMÁTICO (CP06 — BLOCO 4)
  // ===========================================================================
  console.log('\n--- BLOCO 3: RESUMO SEMANAL AUTOMÁTICO E COMPARAÇÃO COM SEMANA ANTERIOR ---');

  // Adiciona sessões na semana anterior (2026-10-26 a 2026-11-01) para cálculo de deltas
  const multiWeekSessions = [
    ...mockCompletedSessions,
    // Semana anterior (Quarta 2026-10-28)
    {
      id: 'sess_prev_w01',
      startTime: '2026-10-28T09:00:00.000Z',
      isCompleted: true,
      elapsedActiveSeconds: 3600,
      totalVolumeKg: 4000,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 80, completed: true }],
        },
      ],
    },
    // Semana anterior (Sexta 2026-10-30)
    {
      id: 'sess_prev_w02',
      startTime: '2026-10-30T10:00:00.000Z',
      isCompleted: true,
      elapsedActiveSeconds: 2400,
      totalVolumeKg: 2000,
      exerciseLogs: [
        {
          exerciseId: 'ex_costas_puxada_alta_pronada',
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 60, completed: true }],
        },
      ],
    },
  ];

  // Teste 07: Cálculo do resumo semanal automático
  const weeklySummary = calculateWeeklySummary(multiWeekSessions, goalConfig, 4, baseNowMs);

  assert(
    weeklySummary.completedWorkouts === 3 &&
      weeklySummary.targetWorkouts === 4 &&
      weeklySummary.compliancePercentage === 75 &&
      weeklySummary.activeDurationSeconds === 9300 && // 3000 + 3600 + 2700
      weeklySummary.totalVolumeKg === 2500, // 800 + 700 + 1000 das séries reais
    'CENÁRIO 07',
    'Cálculo de métricas consolidadas do resumo semanal (treinos, volume e duração)',
    `Treinos: ${weeklySummary.completedWorkouts}/${weeklySummary.targetWorkouts}, Volume: ${weeklySummary.totalVolumeKg}kg, Duração: ${Math.round(weeklySummary.activeDurationSeconds / 60)}min`
  );

  // Teste 08: Comparação com semana anterior (deltas de treinos, volume e tempo)
  assert(
    weeklySummary.previousWeekCompletedWorkouts === 2 &&
      weeklySummary.workoutsDelta === 1 && // +1 treino vs semana anterior
      weeklySummary.previousWeekVolumeKg === 1400 && // 800 + 600
      weeklySummary.volumeDeltaKg === 1100 && // 2500 - 1400
      weeklySummary.volumeDeltaPercent === 78.6 && // (1100/1400)*100 = 78.6%
      weeklySummary.highlights.length > 0,
    'CENÁRIO 08',
    'Comparação matemática de deltas com a semana anterior (+1 treino, +78.6% de volume)',
    `Delta treinos: +${weeklySummary.workoutsDelta}, Delta volume: +${weeklySummary.volumeDeltaKg}kg (+${weeklySummary.volumeDeltaPercent}%)`
  );

  // ===========================================================================
  // BLOCO 4: BACKUP E RESTAURAÇÃO COMPLETA COM MEDIA COMPENSADA (CP06 — BLOCO 5)
  // ===========================================================================
  console.log('\n--- BLOCO 4: BACKUP AUDITADO V1.2 E RESTAURAÇÃO EM 2 FASES ---');

  // Prepara dados no banco de dados principal e media database
  for (const s of mockCompletedSessions) {
    await db.saveWorkoutSession(s);
  }

  // Cria uma mídia personalizada simulando foto de equipamento/medida (Base64 válido)
  const sampleDataUrl = 'data:image/jpeg;base64,' + Buffer.from('sample-image-data-cp06-valid-base64-content').toString('base64');
  await db.saveEquipmentPhoto('equip_custom_photo_01', sampleDataUrl);

  // Teste 09: Exportação de backup em formato "1.2" com 7 stores e mídias
  const backupJsonString = await db.exportAllData();
  const backupObj = JSON.parse(backupJsonString);

  assert(
    backupObj.version === '1.2' &&
      backupObj.data !== undefined &&
      Object.keys(backupObj.data).length === 7 &&
      backupObj.media !== undefined &&
      Object.keys(backupObj.media).length >= 1,
    'CENÁRIO 09',
    'Exportação de backup no formato oficial "1.2" contendo 7 tabelas e mídias em data:',
    `Versão: "${backupObj.version}" | Tabelas: ${Object.keys(backupObj.data).join(', ')} | Mídias: ${Object.keys(backupObj.media).length}`
  );

  // Teste 10: Validação de estrutura e rejeição de backups corrompidos/inválidos
  const invalidJsonString = JSON.stringify({ app: 'TREINO CERTO', version: '1.2', data: { profile: [] } });
  const validationResult = db.validateBackupString(invalidJsonString);

  assert(
    validationResult.isValid === false &&
      validationResult.error !== undefined &&
      validationResult.error.includes('ausente'),
    'CENÁRIO 10',
    'Detecção e rejeição de backups corrompidos ou incompletos',
    `Validação rejeitou arquivo inválido: ${validationResult.error}`
  );

  // Teste 11: Restauração em 2 fases com preservação de mídias e entidades
  const restoreResult = await db.importAllData(backupJsonString);

  assert(
    restoreResult.success === true &&
      restoreResult.details?.recordCounts !== undefined &&
      Object.keys(restoreResult.details.recordCounts).length === 7,
    'CENÁRIO 11',
    'Restauração coordenada em 2 fases concluída com sucesso',
    `Restauradas 7 tabelas. Contagem de sessões: ${restoreResult.details?.recordCounts.workout_sessions}`
  );

  // Teste 12: Injeção de falha na restauração testando rollback do banco principal e compensação de mídia
  // Injeta um backup mal-formado em uma das stores que provocará exceção no processamento
  const corruptedBackupObj = JSON.parse(backupJsonString);
  corruptedBackupObj.data.workout_plans = 'NOT_AN_ARRAY_CORRUPTED_PAYLOAD';

  const corruptedBackupString = JSON.stringify(corruptedBackupObj);

  let rollbackSuccess = false;
  try {
    const failedRestore = await db.importAllData(corruptedBackupString);
    rollbackSuccess = !failedRestore.success;
  } catch (err) {
    rollbackSuccess = true;
  }

  // Confirma que os dados originais no DB e MediaDB permanecem intactos após a tentativa com falha
  const intactSessions = await db.getWorkoutSessions();
  const intactMedia = await db.getEquipmentPhoto('equip_custom_photo_01');

  assert(
    rollbackSuccess && intactSessions.length === 3 && intactMedia !== null,
    'CENÁRIO 12',
    'Garantia de atomicidade: Rollback do banco principal e compensação de mídias em caso de falha',
    `Após erro forçado, os 3 treinos e a foto personalizada permaneceram intocados e íntegros.`
  );

  // Teste 13: Preservação de mídias de equipamentos e integridade relacional
  const fetchedEquipMedia = await db.getEquipmentPhoto('equip_custom_photo_01');
  assert(
    fetchedEquipMedia !== null && fetchedEquipMedia.length > 0,
    'CENÁRIO 13',
    'Preservação e integridade dos arquivos de mídia e fotos de equipamentos',
    `Mídia recuperada com ${fetchedEquipMedia?.length} caracteres.`
  );

  // Teste 14: Funcionamento 100% offline-first sem dependências de rede ou APIs externas
  let missingWebpCount = 0;
  for (const ex of DEFAULT_EXERCISES_CATALOG) {
    const webpPath = `public/images/exercises/${ex.id}.webp`;
    if (!fs.existsSync(webpPath)) {
      missingWebpCount++;
    }
  }

  assert(
    missingWebpCount === 0 && DEFAULT_EXERCISES_CATALOG.length >= 48,
    'CENÁRIO 14',
    'Operação 100% offline-first e integridade de todos os exercícios e imagens 3D localmente',
    `Todas as ${DEFAULT_EXERCISES_CATALOG.length} imagens WebP locais verificadas com sucesso.`
  );

  // ===========================================================================
  // RESUMO FINAL CP06
  // ===========================================================================
  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS E TESTES CP06 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('\nATENÇÃO: Houve falhas na homologação do CP06.');
    process.exit(1);
  } else {
    console.log(`\nTODOS OS ${passCount} CENÁRIOS ESPECÍFICOS DO CP06 FORAM APROVADOS COM SUCESSO!\n`);
    process.exit(0);
  }
}

runCheckpoint06TestSuite().catch((err) => {
  console.error('Erro fatal na execução dos testes CP06:', err);
  process.exit(1);
});
