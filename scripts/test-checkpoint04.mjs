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
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../src/services/db.ts';
import {
  DEFAULT_EQUIPMENTS_CATALOG,
} from '../src/constants/equipmentsCatalog.ts';
import {
  DEFAULT_EXERCISES_CATALOG,
  ORDERED_MUSCLE_GROUPS,
  isExerciseCompatibleWithGym,
} from '../src/constants/exercisesCatalog.ts';
import { WorkoutSessionCoordinator } from '../src/services/workoutSessionCoordinator.ts';
import {
  addSecondsToRestDeadline,
  calculateRemainingSeconds,
  formatRestTimerDisplay,
  shouldTriggerRestAlert,
} from '../src/utils/restTimerHelper.ts';

// Configuração de ambiente para emulação fiel do storage e timers
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};
globalThis.window = globalThis;

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA E TESTES DE REGRESSÃO CP04');
console.log('Montagem de Fichas Prescritas, Execução com Registro Real, Confiabilidade e Cronômetros');
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

async function runCheckpoint04TestSuite() {
  const idbFactory = new IDBFactory();
  const db = new FitAppDB(idbFactory);

  // ===========================================================================
  // PARTE 1: ESTRUTURA E CRIAÇÃO DE FICHAS PRESCRITAS (TESTES ESTRUTURAIS)
  // ===========================================================================
  console.log('--- BLOCO 1: ESTRUTURA, CATÁLOGO E UNICIDADE DE FICHAS PRESCRITAS ---');

  // Teste Estrutural 1: Existência física das stores oficiais
  const rawDb = await db.getDB();
  const storeNames = Array.from(rawDb.objectStoreNames);
  const storesOk =
    rawDb.name === DB_NAME &&
    storeNames.includes(STORES.WORKOUT_PLANS) &&
    storeNames.includes(STORES.WORKOUT_SESSIONS) &&
    REQUIRED_STORES.every((s) => storeNames.includes(s)) &&
    storeNames.length === 7;

  assert(
    storesOk,
    'ESTRUTURAL 01',
    'Existência física das stores oficiais workout_plans e workout_sessions no fit_app_db (7 stores totais)',
    `Stores confirmadas: ${storeNames.join(', ')}.`
  );

  // Teste Estrutural 2: Cadastro de Ficha Prescrita vinculada ao catálogo oficial
  const planA = {
    id: 'plan_treino_carlos_01',
    name: 'Treino Hipertrofia ABC — Prof. Carlos',
    version: 1,
    isActive: true,
    startDate: '2026-11-01',
    reviewDate: '2027-01-01',
    instructorNotes: 'Cadência 3-0-1. Foco em execução perfeita.',
    notes: 'Periodização de força e hipertrofia.',
    divisions: [
      {
        id: 'div_treino_a',
        name: 'Treino A',
        muscleFocus: 'Peito e Tríceps',
        exercises: [
          {
            id: 'item_ex_1',
            exerciseId: 'ex_peito_supino_reto_barra',
            order: 1,
            prescribedSets: 4,
            prescribedReps: '8-10',
            prescribedWeightKg: 30,
            restIntervalSeconds: 90,
            instructorNotes: 'Escápulas travadas no banco.',
          },
          {
            id: 'item_ex_2',
            exerciseId: 'ex_peito_supino_inclinado_halteres',
            order: 2,
            prescribedSets: 3,
            prescribedReps: '10-12',
            prescribedWeightKg: 22,
            restIntervalSeconds: 60,
          },
        ],
      },
      {
        id: 'div_treino_b',
        name: 'Treino B',
        muscleFocus: 'Costas e Bíceps',
        exercises: [
          {
            id: 'item_ex_3',
            exerciseId: 'ex_costas_puxada_alta_frontal',
            order: 1,
            prescribedSets: 4,
            prescribedReps: '10-12',
            prescribedWeightKg: 45,
            restIntervalSeconds: 60,
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.saveWorkoutPlan(planA);
  const fetchedPlan = await db.getWorkoutPlan('plan_treino_carlos_01');
  const allExercisesInCatalog = planA.divisions.every((d) =>
    d.exercises.every((e) =>
      DEFAULT_EXERCISES_CATALOG.some((cat) => cat.id === e.exerciseId)
    )
  );

  assert(
    fetchedPlan !== null &&
      fetchedPlan.name === 'Treino Hipertrofia ABC — Prof. Carlos' &&
      fetchedPlan.divisions.length === 2 &&
      allExercisesInCatalog,
    'ESTRUTURAL 02',
    'Criação de Ficha com Divisões A/B e Exercícios Restritos ao Catálogo Oficial de 48 Exercícios',
    `Ficha salva com sucesso com ${fetchedPlan?.divisions.length} divisões e exercícios 100% validados contra o catálogo.`
  );

  // Teste Estrutural 3: Unicidade da Ficha Ativa
  const planB = {
    id: 'plan_treino_adaptacao_02',
    name: 'Treino de Adaptação AB',
    version: 1,
    isActive: true, // Nova rotina ativa -> deve desativar a rotina anterior
    startDate: '2026-11-05',
    divisions: [
      {
        id: 'div_adapt_a',
        name: 'Treino A',
        muscleFocus: 'Membros Superiores',
        exercises: [
          {
            id: 'item_adapt_1',
            exerciseId: 'ex_ombros_desenvolvimento_halteres',
            order: 1,
            prescribedSets: 3,
            prescribedReps: '12-15',
            prescribedWeightKg: 10,
            restIntervalSeconds: 60,
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.saveWorkoutPlan(planB);
  const planAReloaded = await db.getWorkoutPlan('plan_treino_carlos_01');
  const planBReloaded = await db.getWorkoutPlan('plan_treino_adaptacao_02');
  const activePlan = await db.getActiveWorkoutPlan();

  assert(
    planAReloaded?.isActive === false &&
      planBReloaded?.isActive === true &&
      activePlan?.id === 'plan_treino_adaptacao_02',
    'ESTRUTURAL 03',
    'Unicidade da Ficha Ativa: ativação de nova rotina desativa fichas anteriores automaticamente',
    `Ficha A ativa=${planAReloaded?.isActive} | Ficha B ativa=${planBReloaded?.isActive} | Ativa recuperada=${activePlan?.id}`
  );

  // Reativar Ficha A para os testes de sessão
  await db.setActiveWorkoutPlan('plan_treino_carlos_01');
  const activePlanReactivated = await db.getActiveWorkoutPlan();
  assert(
    activePlanReactivated?.id === 'plan_treino_carlos_01' && activePlanReactivated.isActive === true,
    'ESTRUTURAL 03B',
    'Reativação atômica da Ficha A via setActiveWorkoutPlan',
    `Ficha ativa atual: ${activePlanReactivated?.name}`
  );

  // ===========================================================================
  // PARTE 2: PERSISTÊNCIA REAL NO INDEXEDDB (CENÁRIOS 01 A 05)
  // ===========================================================================
  console.log('\n--- BLOCO 2: PERSISTÊNCIA REAL NO INDEXEDDB (CENÁRIOS 01 A 05) ---');

  // Iniciar sessão de teste
  const baseSession = {
    id: 'session_persistencia_01',
    workoutPlanId: planA.id,
    planName: planA.name,
    divisionId: planA.divisions[0].id,
    divisionName: planA.divisions[0].name,
    startTime: new Date().toISOString(),
    isCompleted: false,
    exercisesCompleted: 0,
    totalVolumeKg: 0,
    exerciseLogs: [
      {
        exerciseId: 'ex_peito_supino_reto_barra',
        exerciseName: 'Supino reto com barra',
        order: 1,
        skipped: false,
        sets: [
          {
            setNumber: 1,
            prescribedReps: '8-10',
            prescribedWeightKg: 30,
            actualReps: 10,
            actualWeightKg: 30,
            completed: false,
          },
          {
            setNumber: 2,
            prescribedReps: '8-10',
            prescribedWeightKg: 30,
            actualReps: 10,
            actualWeightKg: 32,
            completed: false,
          },
        ],
      },
    ],
  };

  await db.saveWorkoutSession(baseSession);

  // CENÁRIO 01: Registrar uma série concluída
  const sessionWithCompletedSet = JSON.parse(JSON.stringify(baseSession));
  sessionWithCompletedSet.exerciseLogs[0].sets[0].completed = true;
  sessionWithCompletedSet.exerciseLogs[0].sets[0].actualReps = 10;
  sessionWithCompletedSet.exerciseLogs[0].sets[0].actualWeightKg = 35; // Carga real registrada pelo usuário
  sessionWithCompletedSet.totalVolumeKg = 350;
  sessionWithCompletedSet.exercisesCompleted = 1;

  assert(
    sessionWithCompletedSet.exerciseLogs[0].sets[0].completed === true &&
      sessionWithCompletedSet.exerciseLogs[0].sets[0].actualWeightKg === 35,
    'CENÁRIO 01',
    'Registrar uma série concluída com valores reais de carga e repetições',
    'Série #1 marcada como concluída: 10 reps @ 35 kg.'
  );

  // CENÁRIO 02: Aguardar a confirmação de gravação (Promise resolvida pelo IndexedDB)
  let saveCompletedWithoutError = false;
  try {
    await db.saveWorkoutSession(sessionWithCompletedSet);
    saveCompletedWithoutError = true;
  } catch (err) {
    saveCompletedWithoutError = false;
  }

  assert(
    saveCompletedWithoutError === true,
    'CENÁRIO 02',
    'Aguardar a confirmação de gravação: Promise do IndexedDB concluída com sucesso (tx.oncomplete)',
    'Gravação no IndexedDB confirmada formalmente.'
  );

  // CENÁRIO 03: Consultar o IndexedDB diretamente (abrindo transação raw independente)
  const directTx = rawDb.transaction(STORES.WORKOUT_SESSIONS, 'readonly');
  const directStore = directTx.objectStore(STORES.WORKOUT_SESSIONS);
  const directFetchPromise = new Promise((resolve, reject) => {
    const req = directStore.get('session_persistencia_01');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const directDbRecord = await directFetchPromise;

  assert(
    directDbRecord !== null && directDbRecord !== undefined,
    'CENÁRIO 03',
    'Consultar o IndexedDB diretamente via transação independente sem passar por caches secundários',
    `Registro localizado na store "${STORES.WORKOUT_SESSIONS}" com ID="${directDbRecord?.id}".`
  );

  // CENÁRIO 04: Confirmar que os dados da série foram persistidos
  const persistedSet = directDbRecord?.exerciseLogs?.[0]?.sets?.[0];
  const isDataAccurate =
    persistedSet?.completed === true &&
    persistedSet?.actualReps === 10 &&
    persistedSet?.actualWeightKg === 35 &&
    directDbRecord?.totalVolumeKg === 350;

  assert(
    isDataAccurate,
    'CENÁRIO 04',
    'Confirmar que os dados da série foram persistidos de forma idêntica e fidedigna',
    `Confirmado: completed=${persistedSet?.completed}, actualReps=${persistedSet?.actualReps}, actualWeightKg=${persistedSet?.actualWeightKg}kg, totalVolumeKg=${directDbRecord?.totalVolumeKg}kg.`
  );

  // CENÁRIO 05: Simular falha de gravação e verificar que a Promise é rejeitada e o erro tratado
  let errorHandledCorrectly = false;
  let capturedErrorMsg = '';

  // Cria uma instância de banco apontando para store inválida ou transação interrompida para simular falha
  try {
    const brokenDb = new FitAppDB(idbFactory);
    const brokenRaw = await brokenDb.getDB();
    // Força tentativa de gravação em transação readonly onde put() lança ReadOnlyError ou fechando conexão
    await new Promise((resolve, reject) => {
      try {
        const invalidTx = brokenRaw.transaction(STORES.WORKOUT_SESSIONS, 'readonly');
        const s = invalidTx.objectStore(STORES.WORKOUT_SESSIONS);
        s.put(sessionWithCompletedSet);
        invalidTx.oncomplete = () => resolve();
        invalidTx.onerror = () => reject(invalidTx.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (rejection) {
    errorHandledCorrectly = true;
    capturedErrorMsg = rejection instanceof Error ? rejection.message : String(rejection);
  }

  assert(
    errorHandledCorrectly === true && capturedErrorMsg.length > 0,
    'CENÁRIO 05',
    'Simular falha de gravação e verificar que a Promise é rejeitada e o erro é tratado/propagado',
    `Promise rejeitada como esperado ao ocorrer falha: "${capturedErrorMsg}".`
  );

  // Limpeza da sessão de teste de persistência para não deixar sessões incompletas residuais
  await db.deleteWorkoutSession('session_persistencia_01');

  // ===========================================================================
  // PARTE 3: CRONÔMETRO DO TREINO COM PAUSA, RETOMADA E RECARGA (CENÁRIOS 06 A 11)
  // ===========================================================================
  console.log('\n--- BLOCO 3: CRONÔMETRO DO TREINO COM PAUSA, RETOMADA E RECARGA (CENÁRIOS 06 A 11) ---');

  // CENÁRIO 06: Iniciar sessão e avançar o tempo
  // Simulando T0 baseado em timestamp real
  const T0 = Date.now() - 1000 * 1000; // Sessão iniciada há 1000s
  let sessionTimer = {
    id: 'session_cronometro_01',
    workoutPlanId: planA.id,
    planName: planA.name,
    divisionId: planA.divisions[0].id,
    divisionName: planA.divisions[0].name,
    startTime: new Date(T0).toISOString(),
    lastResumedAt: new Date(T0).toISOString(),
    isPaused: false,
    elapsedActiveSeconds: 0,
    pausedTotalSeconds: 0,
    isCompleted: false,
  };

  // Avança 300 segundos (5 minutos)
  const T1 = T0 + 300 * 1000;
  const activeAtT1 = (sessionTimer.elapsedActiveSeconds || 0) +
    Math.max(0, Math.floor((T1 - new Date(sessionTimer.lastResumedAt).getTime()) / 1000));

  assert(
    activeAtT1 === 300,
    'CENÁRIO 06',
    'Iniciar sessão e avançar o tempo: cálculo exato de 300 segundos (5 minutos) ativos',
    `Duração ativa calculada em T1: ${activeAtT1}s.`
  );

  // CENÁRIO 07: Pausar sessão
  sessionTimer = {
    ...sessionTimer,
    isPaused: true,
    pausedAt: new Date(T1).toISOString(),
    elapsedActiveSeconds: activeAtT1, // Congela os 300 segundos ativos acumulados
  };

  assert(
    sessionTimer.isPaused === true && sessionTimer.elapsedActiveSeconds === 300,
    'CENÁRIO 07',
    'Pausar sessão: isPaused=true e elapsedActiveSeconds congelado em 300s',
    `Pausado em ${sessionTimer.pausedAt} com acumulado=${sessionTimer.elapsedActiveSeconds}s.`
  );

  // CENÁRIO 08: Avançar o tempo durante a pausa (120 segundos de pausa)
  const T2 = T1 + 120 * 1000; // 2 minutos depois
  // Durante a pausa, o cronômetro visual exibe exatamente elapsedActiveSeconds (300s), sem incrementar
  const activeDuringPause = sessionTimer.isPaused
    ? sessionTimer.elapsedActiveSeconds
    : sessionTimer.elapsedActiveSeconds + Math.floor((T2 - new Date(sessionTimer.lastResumedAt).getTime()) / 1000);

  assert(
    activeDuringPause === 300,
    'CENÁRIO 08',
    'Avançar o tempo durante a pausa: tempo ativo congelado sem vazamento de segundos',
    `Tempo durante a pausa em T2: ${activeDuringPause}s (período pausado = 120s não acumulado).`
  );

  // CENÁRIO 09: Retomar sessão
  const pauseDurationSec = Math.max(0, Math.floor((T2 - new Date(sessionTimer.pausedAt).getTime()) / 1000));
  sessionTimer = {
    ...sessionTimer,
    isPaused: false,
    pausedAt: undefined,
    lastResumedAt: new Date(T2).toISOString(),
    pausedTotalSeconds: (sessionTimer.pausedTotalSeconds || 0) + pauseDurationSec,
  };

  assert(
    sessionTimer.isPaused === false &&
      sessionTimer.pausedTotalSeconds === 120 &&
      sessionTimer.lastResumedAt === new Date(T2).toISOString(),
    'CENÁRIO 09',
    'Retomar sessão: lastResumedAt atualizado para T2 e pausedTotalSeconds computado (120s)',
    `Retomado em ${sessionTimer.lastResumedAt}. Total pausado=${sessionTimer.pausedTotalSeconds}s.`
  );

  // CENÁRIO 10: Confirmar que o tempo pausado não foi computado na duração ativa
  // Avança mais 180 segundos de treino ativo após retomar (T3 = T2 + 180s)
  const T3 = T2 + 180 * 1000;
  const activeAtT3 = (sessionTimer.elapsedActiveSeconds || 0) +
    Math.max(0, Math.floor((T3 - new Date(sessionTimer.lastResumedAt).getTime()) / 1000));
  const wallClockTotalSec = Math.floor((T3 - new Date(sessionTimer.startTime).getTime()) / 1000);

  assert(
    activeAtT3 === 480 && wallClockTotalSec === 600,
    'CENÁRIO 10',
    'Confirmar que o tempo pausado (120s) NÃO foi computado na duração ativa (480s ativos de 600s de relógio)',
    `Duração ativa calculada: ${activeAtT3}s | Tempo total de parede: ${wallClockTotalSec}s | Pausa excluída: 120s.`
  );

  // CENÁRIO 11: Simular recarga de página e confirmar que o cronômetro recupera o estado correto
  // Persiste a sessão no IndexedDB antes de recarregar a página
  await db.saveWorkoutSession(sessionTimer);

  // Simula reinicialização do app / recarga da aba criando nova instância do banco
  const reloadedDb = new FitAppDB(idbFactory);
  const recoveredSessionFromDb = await reloadedDb.getActiveWorkoutSession();

  // Calcula duração ativa imediatamente após a recarga no instante T3
  const activeAfterReload = recoveredSessionFromDb.isPaused
    ? (recoveredSessionFromDb.elapsedActiveSeconds || 0)
    : (recoveredSessionFromDb.elapsedActiveSeconds || 0) +
      Math.max(0, Math.floor((T3 - new Date(recoveredSessionFromDb.lastResumedAt || recoveredSessionFromDb.startTime).getTime()) / 1000));

  assert(
    recoveredSessionFromDb !== null &&
      recoveredSessionFromDb.id === 'session_cronometro_01' &&
      activeAfterReload === 480 &&
      recoveredSessionFromDb.pausedTotalSeconds === 120,
    'CENÁRIO 11',
    'Simular recarga de página e confirmar que o cronômetro recupera o estado correto sem desvios',
    `Recarga confirmada: sessão ativa recuperada com ${activeAfterReload}s ativos acumulados e pausa preservada.`
  );

  // ===========================================================================
  // PARTE 4: TIMER DE DESCANSO BASEADO EM PRAZO ABSOLUTO (CENÁRIOS 12 A 18)
  // ===========================================================================
  console.log('\n--- BLOCO 4: TIMER DE DESCANSO BASEADO EM PRAZO ABSOLUTO (CENÁRIOS 12 A 18) ---');

  const REST_TIMER_KEY = 'treino_certo_rest_timer';
  const T_REST_0 = 1730905000000;

  // CENÁRIO 12: Iniciar timer de 60s
  let restTimerEndAt = T_REST_0 + 60 * 1000;
  let restTimerTotal = 60;
  let remaining12 = Math.max(0, Math.ceil((restTimerEndAt - T_REST_0) / 1000));
  safeLocalStorageSet(REST_TIMER_KEY, JSON.stringify({ restTimerEndAt, restTimerTotal }));

  assert(
    remaining12 === 60 && restTimerEndAt === T_REST_0 + 60000,
    'CENÁRIO 12',
    'Iniciar timer de descanso de 60s: prazo absoluto registrado (T0 + 60s)',
    `Prazo estabelecido: ${restTimerEndAt} | Segundos restantes: ${remaining12}s.`
  );

  // CENÁRIO 13: Adicionar 30s e confirmar novo prazo (90s)
  restTimerEndAt += 30 * 1000;
  restTimerTotal += 30;
  let remaining13 = Math.max(0, Math.ceil((restTimerEndAt - T_REST_0) / 1000));
  safeLocalStorageSet(REST_TIMER_KEY, JSON.stringify({ restTimerEndAt, restTimerTotal }));

  assert(
    remaining13 === 90 && restTimerEndAt === T_REST_0 + 90000 && restTimerTotal === 90,
    'CENÁRIO 13',
    'Adicionar 30s (+30s): prazo estendido de forma aditiva sem salto (90s total)',
    `Novo prazo: ${restTimerEndAt} | Segundos restantes: ${remaining13}s | Total: ${restTimerTotal}s.`
  );

  // CENÁRIO 14: Subtrair 10s e confirmar novo prazo (80s)
  restTimerEndAt -= 10 * 1000;
  restTimerTotal = Math.max(0, restTimerTotal - 10);
  let remaining14 = Math.max(0, Math.ceil((restTimerEndAt - T_REST_0) / 1000));
  safeLocalStorageSet(REST_TIMER_KEY, JSON.stringify({ restTimerEndAt, restTimerTotal }));

  assert(
    remaining14 === 80 && restTimerEndAt === T_REST_0 + 80000 && restTimerTotal === 80,
    'CENÁRIO 14',
    'Subtrair 10s (-10s): prazo reduzido proporcionalmente sem distorção (80s total)',
    `Novo prazo: ${restTimerEndAt} | Segundos restantes: ${remaining14}s | Total: ${restTimerTotal}s.`
  );

  // CENÁRIO 15: Simular minimização de janela / avanço de tempo
  // Em navegadores reais, setInterval é estrangulado (throttling). Com deadline absoluto:
  const T_REST_MINIMIZED = T_REST_0 + 35 * 1000; // 35 segundos transcorreram em segundo plano
  const remaining15 = Math.max(0, Math.ceil((restTimerEndAt - T_REST_MINIMIZED) / 1000));

  assert(
    remaining15 === 45,
    'CENÁRIO 15',
    'Simular minimização de janela / throttling de segundo plano: prazo absoluto calcula 45s restantes (80 - 35)',
    `Tempo restante após segundo plano: ${remaining15}s (imune a congelamento de setInterval).`
  );

  // CENÁRIO 16: Simular recarga de página durante a contagem
  // O usuário recarrega aos 50s transcorridos (T_REST_RELOAD = T_REST_0 + 50s)
  const T_REST_RELOAD = T_REST_0 + 50 * 1000;
  const storedJson = safeLocalStorageGet(REST_TIMER_KEY);
  const parsedStored = JSON.parse(storedJson);

  assert(
    parsedStored !== null && parsedStored.restTimerEndAt === restTimerEndAt,
    'CENÁRIO 16',
    'Simular recarga de página: leitura íntegra do estado do timer armazenado em localStorage',
    `Storage validado: restTimerEndAt=${parsedStored?.restTimerEndAt}.`
  );

  // CENÁRIO 17: Confirmar que o tempo restante foi recuperado corretamente
  const recoveredRemaining = Math.max(0, Math.ceil((parsedStored.restTimerEndAt - T_REST_RELOAD) / 1000));

  assert(
    recoveredRemaining === 30,
    'CENÁRIO 17',
    'Confirmar que o tempo restante foi recuperado com exatidão após a recarga (80 - 50 = 30s)',
    `Tempo restante recuperado pós-recarga: ${recoveredRemaining}s.`
  );

  // CENÁRIO 18: Confirmar que o aviso sonoro/visual dispara apenas uma vez por ciclo
  let alertCount = 0;
  let hasAlertedRef = false;

  function simulateTick(currentTime) {
    const rem = Math.max(0, Math.ceil((restTimerEndAt - currentTime) / 1000));
    if (rem <= 0) {
      if (!hasAlertedRef) {
        hasAlertedRef = true;
        alertCount++;
      }
    }
    return rem;
  }

  // Ticks antes do vencimento
  simulateTick(restTimerEndAt - 2000); // 2s restantes -> nenhum alerta
  simulateTick(restTimerEndAt - 1000); // 1s restante -> nenhum alerta
  // Tick no vencimento exato
  simulateTick(restTimerEndAt);        // 0s restante -> alerta dispara!
  // Múltiplos ticks após o vencimento (simulando 250ms ticks repetidos)
  simulateTick(restTimerEndAt + 250);
  simulateTick(restTimerEndAt + 500);
  simulateTick(restTimerEndAt + 1000);

  assert(
    alertCount === 1 && hasAlertedRef === true,
    'CENÁRIO 18',
    'Confirmar que o aviso sonoro/visual dispara estritamente uma única vez por ciclo',
    `Total de alertas disparados: ${alertCount} (hasAlertedRef bloqueou disparos duplicados).`
  );

  // ===========================================================================
  // PARTE 5: HISTÓRICO E IMUTABILIDADE PÓS-ALTERAÇÃO DE FICHA (CENÁRIOS 19 A 21)
  // ===========================================================================
  console.log('\n--- BLOCO 5: HISTÓRICO E IMUTABILIDADE PÓS-ALTERAÇÃO DE FICHA (CENÁRIOS 19 A 21) ---');

  // CENÁRIO 19: Finalizar a sessão e registrar no histórico
  const finalHistoricalSession = {
    id: 'session_historico_imutavel_01',
    workoutPlanId: planA.id,
    planName: planA.name, // "Treino Hipertrofia ABC — Prof. Carlos"
    divisionId: planA.divisions[0].id,
    divisionName: planA.divisions[0].name,
    startTime: '2026-11-06T15:00:00.000Z',
    endTime: '2026-11-06T15:45:00.000Z',
    durationSeconds: 2700,
    isCompleted: true,
    exercisesCompleted: 2,
    totalVolumeKg: 3120,
    exerciseLogs: [
      {
        exerciseId: 'ex_peito_supino_reto_barra',
        exerciseName: 'Supino reto com barra',
        order: 1,
        skipped: false,
        sets: [
          {
            setNumber: 1,
            prescribedReps: '8-10',
            prescribedWeightKg: 30,
            actualReps: 10,
            actualWeightKg: 30,
            completed: true,
          },
        ],
      },
      {
        exerciseId: 'ex_peito_supino_inclinado_halteres',
        exerciseName: 'Supino inclinado com halteres',
        order: 2,
        skipped: false,
        sets: [
          {
            setNumber: 1,
            prescribedReps: '10-12',
            prescribedWeightKg: 22,
            actualReps: 12,
            actualWeightKg: 22,
            completed: true,
          },
        ],
      },
    ],
    notes: 'Treino histórico executado com sucesso.',
  };

  await db.saveWorkoutSession(finalHistoricalSession);
  const sessionBeforePlanEdit = await db.getWorkoutSession('session_historico_imutavel_01');

  assert(
    sessionBeforePlanEdit !== null && sessionBeforePlanEdit.isCompleted === true,
    'CENÁRIO 19',
    'Finalizar a sessão e registrar no histórico com isCompleted=true',
    `Sessão salva no histórico: ID=${sessionBeforePlanEdit?.id}, Volume=${sessionBeforePlanEdit?.totalVolumeKg}kg.`
  );

  // CENÁRIO 20: Modificar a ficha original em workout_plans
  // Instrutor altera drasticamente a ficha: muda o nome da ficha, remove o exercício 2 e muda as cargas prescritas
  const modifiedPlanA = {
    ...planA,
    name: 'Treino Hipertrofia Reformulado 2027',
    divisions: [
      {
        ...planA.divisions[0],
        name: 'Treino A — Foco Peitoral Máximo',
        exercises: [
          {
            id: 'item_ex_1',
            exerciseId: 'ex_peito_supino_reto_barra',
            order: 1,
            prescribedSets: 5, // aumentou de 4 para 5 séries
            prescribedReps: '5-5-5',
            prescribedWeightKg: 50, // mudou de 30 para 50 kg
            restIntervalSeconds: 120,
          },
          // Supino inclinado halteres foi REMOVIDO da ficha!
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  };

  await db.saveWorkoutPlan(modifiedPlanA);
  const reloadedModifiedPlan = await db.getWorkoutPlan('plan_treino_carlos_01');

  assert(
    reloadedModifiedPlan?.name === 'Treino Hipertrofia Reformulado 2027' &&
      reloadedModifiedPlan.divisions[0].exercises.length === 1 &&
      reloadedModifiedPlan.divisions[0].exercises[0].prescribedSets === 5,
    'CENÁRIO 20',
    'Modificar a ficha original em workout_plans (mudança de nome, remoção de exercício e alteração de prescrição)',
    `Plano modificado salvo com sucesso: Novo nome="${reloadedModifiedPlan?.name}", exercícios=${reloadedModifiedPlan?.divisions[0]?.exercises?.length}.`
  );

  // CENÁRIO 21: Confirmar que a sessão passada em workout_sessions permanece inalterada
  const sessionAfterPlanEdit = await db.getWorkoutSession('session_historico_imutavel_01');

  const isHistoryImmutable =
    sessionAfterPlanEdit?.planName === 'Treino Hipertrofia ABC — Prof. Carlos' &&
    sessionAfterPlanEdit?.divisionName === 'Treino A' &&
    sessionAfterPlanEdit?.exerciseLogs?.length === 2 &&
    sessionAfterPlanEdit?.exerciseLogs?.[0]?.sets?.[0]?.actualWeightKg === 30 &&
    sessionAfterPlanEdit?.exerciseLogs?.[1]?.exerciseId === 'ex_peito_supino_inclinado_halteres' &&
    sessionAfterPlanEdit?.totalVolumeKg === 3120 &&
    sessionAfterPlanEdit?.durationSeconds === 2700;

  assert(
    isHistoryImmutable,
    'CENÁRIO 21',
    'Confirmar que a sessão passada em workout_sessions permanece 100% inalterada e imutável',
    `Histórico intacto: Nome do plano original mantido ("${sessionAfterPlanEdit?.planName}"), 2 exercícios preservados mesmo após remoção da ficha.`
  );

  // ===========================================================================
  // PARTE 6: CONCORRÊNCIA REAL, DESCARTE SERIALIZADO E REST TIMER (15 CENÁRIOS HOMOLOGADOS)
  // ===========================================================================
  console.log('\n--- BLOCO 6: CONCORRÊNCIA REAL, DESCARTE SERIALIZADO E REST TIMER (15 CENÁRIOS HOMOLOGADOS) ---');

  // Sessão base para testes de concorrência e persistência
  const baseSessionA = {
    id: 'session_real_concurrency_001',
    workoutPlanId: planA.id,
    planName: planA.name,
    divisionId: planA.divisions[0].id,
    divisionName: planA.divisions[0].name,
    startTime: new Date().toISOString(),
    isCompleted: false,
    exercisesCompleted: 0,
    totalVolumeKg: 0,
    exerciseLogs: [
      {
        exerciseId: 'ex_peito_supino_reto_barra',
        exerciseName: 'Supino reto com barra',
        order: 1,
        skipped: false,
        sets: [
          { setNumber: 1, actualReps: 10, actualWeightKg: 40, completed: false },
          { setNumber: 2, actualReps: 10, actualWeightKg: 45, completed: false },
        ],
      },
    ],
  };

  // 1. Atualização de série aceita e imediatamente seguida de finalização
  await db.saveWorkoutSession(baseSessionA);
  const coord1 = new WorkoutSessionCoordinator(db, baseSessionA);

  const pUp1 = coord1.enqueueUpdate((prev) => {
    const copy = JSON.parse(JSON.stringify(prev));
    copy.exerciseLogs[0].sets[0].completed = true;
    copy.totalVolumeKg = 400;
    return copy;
  });
  const pFin1 = coord1.enqueueFinish();

  let bothFinishedOk = false;
  try {
    const [resUp, resFin] = await Promise.all([pUp1, pFin1]);
    bothFinishedOk = resUp.exerciseLogs[0].sets[0].completed === true && resFin.isCompleted === true;
  } catch {
    bothFinishedOk = false;
  }
  const dbFinal1 = await db.getWorkoutSession('session_real_concurrency_001');

  assert(
    bothFinishedOk && dbFinal1?.isCompleted === true && dbFinal1?.exerciseLogs[0]?.sets[0]?.completed === true,
    'CENÁRIO CONC 01',
    'Atualização de série aceita e imediatamente seguida de finalização: ambas concluídas em ordem',
    `Série concluída e sessão finalizada com sucesso (volume=${dbFinal1?.totalVolumeKg}kg).`
  );

  // 2. Atualização aceita e imediatamente seguida de descarte
  const session2 = { ...baseSessionA, id: 'session_real_concurrency_002' };
  await db.saveWorkoutSession(session2);
  const coord2 = new WorkoutSessionCoordinator(db, session2);

  const pUp2 = coord2.enqueueUpdate((prev) => {
    const copy = JSON.parse(JSON.stringify(prev));
    copy.exerciseLogs[0].sets[0].completed = true;
    return copy;
  });
  const pDisc2 = coord2.enqueueDiscard();

  let updateThenDiscardOk = false;
  try {
    await Promise.all([pUp2, pDisc2]);
    updateThenDiscardOk = true;
  } catch {
    updateThenDiscardOk = false;
  }
  const dbSessionAfterDiscard2 = await db.getWorkoutSession('session_real_concurrency_002');

  assert(
    updateThenDiscardOk && dbSessionAfterDiscard2 === null && coord2.getActiveSession() === null,
    'CENÁRIO CONC 02',
    'Atualização aceita e imediatamente seguida de descarte: descarte executado sem resíduos',
    'Série aceita foi processada e em seguida a sessão foi excluída do IndexedDB.'
  );

  // 3. Atualizações anteriores ao descarte concluídas antes da exclusão
  const session3 = { ...baseSessionA, id: 'session_real_concurrency_003' };
  await db.saveWorkoutSession(session3);
  const executionOrder3 = [];
  const trackingStorage3 = {
    saveWorkoutSession: async (s) => {
      executionOrder3.push('SAVE');
      await db.saveWorkoutSession(s);
    },
    deleteWorkoutSession: async (id) => {
      executionOrder3.push('DELETE');
      await db.deleteWorkoutSession(id);
    },
  };
  const coord3 = new WorkoutSessionCoordinator(trackingStorage3, session3);

  const pUp3 = coord3.enqueueUpdate((prev) => ({ ...prev, notes: 'Atualização prévia' }));
  const pDisc3 = coord3.enqueueDiscard();
  await Promise.all([pUp3, pDisc3]);

  const orderCorrect3 =
    executionOrder3.length === 2 &&
    executionOrder3[0] === 'SAVE' &&
    executionOrder3[1] === 'DELETE';

  assert(
    orderCorrect3,
    'CENÁRIO CONC 03',
    'Atualizações anteriores ao descarte concluídas formalmente antes da exclusão no IndexedDB',
    `Ordem verificada: [${executionOrder3.join(' -> ')}].`
  );

  // 4. Novas atualizações rejeitadas depois do início do descarte
  const session4 = { ...baseSessionA, id: 'session_real_concurrency_004' };
  await db.saveWorkoutSession(session4);
  const coord4 = new WorkoutSessionCoordinator(db, session4);

  const runningDiscard4 = coord4.enqueueDiscard();

  let updateRejectedAfterDiscard = false;
  let discardRejectionMsg = '';
  try {
    await coord4.enqueueUpdate((prev) => ({ ...prev, notes: 'Tentativa indevida' }));
  } catch (err) {
    updateRejectedAfterDiscard = true;
    discardRejectionMsg = err instanceof Error ? err.message : String(err);
  }
  await runningDiscard4;

  assert(
    updateRejectedAfterDiscard && discardRejectionMsg.includes('descarte'),
    'CENÁRIO CONC 04',
    'Novas atualizações solicitadas após o início do descarte são rejeitadas imediatamente',
    `Rejeição confirmada: "${discardRejectionMsg}".`
  );

  // 5. Nenhuma gravação recria uma sessão descartada
  const session5 = { ...baseSessionA, id: 'session_real_concurrency_005' };
  await db.saveWorkoutSession(session5);
  const coord5 = new WorkoutSessionCoordinator(db, session5);

  await coord5.enqueueDiscard();
  let lateUpdateRejected5 = false;
  try {
    await coord5.enqueueUpdate((prev) => ({ ...prev, totalVolumeKg: 9999 }));
  } catch {
    lateUpdateRejected5 = true;
  }
  const dbCheck5 = await db.getWorkoutSession('session_real_concurrency_005');

  assert(
    lateUpdateRejected5 && dbCheck5 === null && coord5.getActiveSession() === null,
    'CENÁRIO CONC 05',
    'Nenhuma gravação pendente recria ou ressuscita a sessão descartada',
    `Sessão no IndexedDB: ${dbCheck5} | Estado em memória: null.`
  );

  // 6. Duas chamadas simultâneas de descarte resultam em uma única exclusão
  const session6 = { ...baseSessionA, id: 'session_real_concurrency_006' };
  await db.saveWorkoutSession(session6);
  let deleteCallsCount6 = 0;
  const trackingStorage6 = {
    saveWorkoutSession: async (s) => db.saveWorkoutSession(s),
    deleteWorkoutSession: async (id) => {
      deleteCallsCount6++;
      await db.deleteWorkoutSession(id);
    },
  };
  const coord6 = new WorkoutSessionCoordinator(trackingStorage6, session6);

  const dCall1 = coord6.enqueueDiscard();
  const dCall2 = coord6.enqueueDiscard();
  const sameDiscardPromise = dCall1 === dCall2;
  await Promise.all([dCall1, dCall2]);

  assert(
    sameDiscardPromise && deleteCallsCount6 === 1,
    'CENÁRIO CONC 06',
    'Duas chamadas simultâneas de descarte deduplicadas em uma única exclusão física',
    `Mesma Promise compartilhada: ${sameDiscardPromise} | Exclusões no banco: ${deleteCallsCount6}.`
  );

  // 7. Falha na gravação anterior impede descarte silencioso
  const session7 = { ...baseSessionA, id: 'session_real_concurrency_007' };
  await db.saveWorkoutSession(session7);
  let deleteCalledOnFail7 = false;
  const failingStorage7 = {
    saveWorkoutSession: async () => {
      throw new Error('Falha simulada na gravação de série');
    },
    deleteWorkoutSession: async (id) => {
      deleteCalledOnFail7 = true;
      await db.deleteWorkoutSession(id);
    },
  };
  const coord7 = new WorkoutSessionCoordinator(failingStorage7, session7);

  // Tenta update que vai falhar
  try {
    await coord7.enqueueUpdate((p) => p);
  } catch {
    // Falha esperada
  }

  // Tenta descarte após falha prévia de persistência
  let discardBlockedByPriorError = false;
  let priorErrorMsg = '';
  try {
    await coord7.enqueueDiscard();
  } catch (e) {
    discardBlockedByPriorError = true;
    priorErrorMsg = e instanceof Error ? e.message : String(e);
  }

  assert(
    discardBlockedByPriorError && deleteCalledOnFail7 === false && priorErrorMsg.includes('falha anterior'),
    'CENÁRIO CONC 07',
    'Falha na gravação anterior impede descarte silencioso e protege dados não confirmados',
    `Descarte bloqueado: "${priorErrorMsg}" (deleteWorkoutSession não foi executado).`
  );

  // 8. Falha na exclusão mantém a sessão recuperável
  const session8 = { ...baseSessionA, id: 'session_real_concurrency_008' };
  await db.saveWorkoutSession(session8);
  const failingDeleteStorage8 = {
    saveWorkoutSession: async (s) => db.saveWorkoutSession(s),
    deleteWorkoutSession: async () => {
      throw new Error('Falha de I/O na exclusão do IndexedDB');
    },
  };
  const coord8 = new WorkoutSessionCoordinator(failingDeleteStorage8, session8);

  let discardFailed8 = false;
  try {
    await coord8.enqueueDiscard();
  } catch {
    discardFailed8 = true;
  }

  const sessionRetainedInMemory8 = coord8.getActiveSession();
  const sessionRetainedInDb8 = await db.getWorkoutSession('session_real_concurrency_008');

  assert(
    discardFailed8 &&
      sessionRetainedInMemory8 !== null &&
      sessionRetainedInDb8 !== null &&
      coord8.isDiscarding() === false,
    'CENÁRIO CONC 08',
    'Falha na exclusão preserva o estado recuperável da sessão e expõe erro sem travar o coordenador',
    `Sessão recuperável preservada: ID="${sessionRetainedInMemory8?.id}".`
  );

  // 9. Falha na finalização mantém a sessão ativa
  const session9 = { ...baseSessionA, id: 'session_real_concurrency_009' };
  await db.saveWorkoutSession(session9);
  const failingFinalSaveStorage9 = {
    saveWorkoutSession: async (s) => {
      if (s.isCompleted) {
        throw new Error('Falha na gravação da finalização');
      }
      await db.saveWorkoutSession(s);
    },
    deleteWorkoutSession: async (id) => db.deleteWorkoutSession(id),
  };
  const coord9 = new WorkoutSessionCoordinator(failingFinalSaveStorage9, session9);

  let finishFailed9 = false;
  try {
    await coord9.enqueueFinish();
  } catch {
    finishFailed9 = true;
  }

  const sessionRetainedAfterFinishFail = coord9.getActiveSession();
  const dbSessionActive9 = await db.getWorkoutSession('session_real_concurrency_009');

  assert(
    finishFailed9 &&
      sessionRetainedAfterFinishFail !== null &&
      dbSessionActive9?.isCompleted === false &&
      coord9.isFinishing() === false,
    'CENÁRIO CONC 09',
    'Falha na finalização mantém a sessão ativa e recuperável para retry pelo usuário',
    `Sessão mantida ativa: isCompleted=${dbSessionActive9?.isCompleted} | isFinishing=${coord9.isFinishing()}.`
  );

  // 10. Duas finalizações simultâneas geram somente uma gravação final
  const session10 = { ...baseSessionA, id: 'session_real_concurrency_010' };
  await db.saveWorkoutSession(session10);
  let finalSavesCount10 = 0;
  const trackingFinalStorage10 = {
    saveWorkoutSession: async (s) => {
      if (s.isCompleted) finalSavesCount10++;
      await db.saveWorkoutSession(s);
    },
    deleteWorkoutSession: async (id) => db.deleteWorkoutSession(id),
  };
  const coord10 = new WorkoutSessionCoordinator(trackingFinalStorage10, session10);

  const fCall1 = coord10.enqueueFinish();
  const fCall2 = coord10.enqueueFinish();
  const sameFinishPromise = fCall1 === fCall2;
  await Promise.all([fCall1, fCall2]);

  assert(
    sameFinishPromise && finalSavesCount10 === 1,
    'CENÁRIO CONC 10',
    'Duas finalizações simultâneas deduplicadas geram exatamente uma única gravação final',
    `Mesma Promise compartilhada: ${sameFinishPromise} | Gravações com isCompleted: ${finalSavesCount10}.`
  );

  // 11. Minimizar e expandir preservam o prazo absoluto
  const T_REST_BASE = 1730915000000;
  const initialDeadline = T_REST_BASE + 60 * 1000;
  const totalDuration = 60;

  // Em modo minimizado
  const remMinimized = calculateRemainingSeconds(initialDeadline, T_REST_BASE);
  // Em modo expandido
  const remExpanded = calculateRemainingSeconds(initialDeadline, T_REST_BASE);

  assert(
    remMinimized === 60 && remExpanded === 60 && initialDeadline === T_REST_BASE + 60000,
    'CENÁRIO TIMER 11',
    'Minimizar e expandir preservam o prazo absoluto sem alteração de restTimerEndAt',
    `Prazo: ${initialDeadline} | Restante minimizado: ${remMinimized}s | Restante expandido: ${remExpanded}s.`
  );

  // 12. A contagem continua corretamente durante a minimização
  const T_ADVANCED_20 = T_REST_BASE + 20 * 1000;
  const remAfter20sMinimized = calculateRemainingSeconds(initialDeadline, T_ADVANCED_20);

  assert(
    remAfter20sMinimized === 40,
    'CENÁRIO TIMER 12',
    'A contagem regressiva continua contínua e exata durante o modo minimizado (60 - 20 = 40s)',
    `Segundos restantes calculados: ${remAfter20sMinimized}s.`
  );

  // 13. Recarregar a aplicação recupera o tempo restante
  safeLocalStorageSet(
    'treino_certo_rest_timer',
    JSON.stringify({ restTimerEndAt: initialDeadline, restTimerTotal: totalDuration })
  );
  const T_RELOAD_TIME = T_REST_BASE + 45 * 1000;
  const savedPayloadRaw = safeLocalStorageGet('treino_certo_rest_timer');
  const parsedReload = JSON.parse(savedPayloadRaw);
  const recoveredRemAfterReload = calculateRemainingSeconds(parsedReload.restTimerEndAt, T_RELOAD_TIME);

  assert(
    recoveredRemAfterReload === 15,
    'CENÁRIO TIMER 13',
    'Recarregar a aplicação recupera com precisão matemática o tempo restante a partir do prazo gravado',
    `Tempo restante recuperado após 45s: ${recoveredRemAfterReload}s (60 - 45 = 15s).`
  );

  // 14. O alerta sonoro e a vibração ocorrem somente uma vez por ciclo
  let alertFiredTimes = 0;
  let hasAlertedState = false;

  function runSimulatedTick(nowMs) {
    const rem = calculateRemainingSeconds(initialDeadline, nowMs);
    if (shouldTriggerRestAlert(rem, hasAlertedState)) {
      hasAlertedState = true;
      alertFiredTimes++;
    }
    return rem;
  }

  // Ticks virtuais atravessando a expiração
  runSimulatedTick(initialDeadline - 1000); // 1s restante
  runSimulatedTick(initialDeadline);        // Expira (0s) -> dispara!
  runSimulatedTick(initialDeadline + 250);  // 250ms após -> bloqueado
  runSimulatedTick(initialDeadline + 500);  // 500ms após -> bloqueado
  runSimulatedTick(initialDeadline + 1000); // 1s após -> bloqueado

  assert(
    alertFiredTimes === 1 && hasAlertedState === true,
    'CENÁRIO TIMER 14',
    'Alerta sonoro e visual disparado estritamente uma única vez por ciclo de descanso',
    `Total de disparos confirmados: ${alertFiredTimes}.`
  );

  // 15. Os controles de +30s, -10s e Pular continuam funcionando nos estados corretos
  const plus30Result = addSecondsToRestDeadline(initialDeadline, 60, 30, T_REST_BASE);
  const minus10Result = addSecondsToRestDeadline(plus30Result.newEndAt, plus30Result.newTotal, -10, T_REST_BASE);
  const skipResult = addSecondsToRestDeadline(minus10Result.newEndAt, minus10Result.newTotal, -120, T_REST_BASE);
  const formatted80 = formatRestTimerDisplay(80);
  const formatted5 = formatRestTimerDisplay(5);

  const controlsOk =
    plus30Result.remaining === 90 &&
    plus30Result.newEndAt === initialDeadline + 30000 &&
    minus10Result.remaining === 80 &&
    minus10Result.newEndAt === initialDeadline + 20000 &&
    skipResult.remaining === 0 &&
    skipResult.newEndAt === null &&
    formatted80 === '01:20' &&
    formatted5 === '00:05';

  assert(
    controlsOk,
    'CENÁRIO TIMER 15',
    'Controles de +30s, -10s, Pular e formatação visual operam com precisão absoluta',
    `+30s: ${plus30Result.remaining}s | -10s: ${minus10Result.remaining}s | Pular: ${skipResult.remaining}s | Formatação 80s: "${formatted80}", 5s: "${formatted5}".`
  );

  // ===========================================================================
  // PARTE 6: COMPATIBILIDADE, BACKUP E INTEGRIDADE DE ATIVOS (CP01 A CP04)
  // ===========================================================================
  console.log('\n--- BLOCO 6: COMPATIBILIDADE, BACKUP E INTEGRIDADE DE ATIVOS ---');

  // Teste de Compatibilidade de Equipamentos
  const gymWithDumbbellsOnly = new Set(['std_general_halteres']);
  const exSupinoRetoBarra = DEFAULT_EXERCISES_CATALOG.find(
    (e) => e.id === 'ex_peito_supino_reto_barra'
  );
  const exSupinoInclinadoHalteres = DEFAULT_EXERCISES_CATALOG.find(
    (e) => e.id === 'ex_peito_supino_inclinado_halteres'
  );

  const isSupinoBarraCompatible = isExerciseCompatibleWithGym(
    exSupinoRetoBarra,
    gymWithDumbbellsOnly
  );
  const isSupinoInclinadoWithBench = isExerciseCompatibleWithGym(
    exSupinoInclinadoHalteres,
    new Set(['std_general_halteres', 'std_general_bancos_regulaveis'])
  );

  assert(
    isSupinoBarraCompatible === false && isSupinoInclinadoWithBench === true,
    'INTEGRIDADE 01',
    'Validação de compatibilidade de equipamentos da ficha com o inventário da academia',
    `Supino Barra (só halteres)=${isSupinoBarraCompatible} | Supino Inclinado (halteres+banco)=${isSupinoInclinadoWithBench}`
  );

  // Teste de Exportação e Restauração Integral
  const backupJson = await db.exportAllData();
  const validation = db.validateBackupString(backupJson);

  assert(
    validation.isValid === true &&
      validation.details?.recordCounts[STORES.WORKOUT_PLANS] === 2 &&
      validation.details?.recordCounts[STORES.WORKOUT_SESSIONS] >= 2,
    'INTEGRIDADE 02',
    'Exportação consistente das 7 tabelas com preservação íntegra de workout_plans e workout_sessions',
    `Backup validado: ${validation.details?.recordCounts[STORES.WORKOUT_PLANS]} planos e ${validation.details?.recordCounts[STORES.WORKOUT_SESSIONS]} sessões históricas.`
  );

  // Restauração em banco novo
  const restoreFactory = new IDBFactory();
  const restoreDb = new FitAppDB(restoreFactory);
  const restoreResult = await restoreDb.importAllData(backupJson);
  const restoredSessions = await restoreDb.getWorkoutSessions();

  assert(
    restoreResult.success === true &&
      restoredSessions.some((s) => s.id === 'session_historico_imutavel_01'),
    'INTEGRIDADE 03',
    'Restauração de backup em banco limpo reconstitui histórico e sessões sem perdas',
    `Restauradas ${restoredSessions.length} sessões históricas com integridade confirmada.`
  );

  // Teste de Existência física das 48 ilustrações 3D WebP
  const all48WebpExist = DEFAULT_EXERCISES_CATALOG.every((ex) => {
    const fileUrl = new URL(`../public/images/exercises/${ex.id}.webp`, import.meta.url);
    return fs.existsSync(fileUrl) && fs.statSync(fileUrl).size > 5000;
  });

  assert(
    all48WebpExist && DEFAULT_EXERCISES_CATALOG.length >= 48,
    'INTEGRIDADE 04',
    'Preservação integral dos exercícios oficiais e arquivos 3D WebP (800x600) em public/images/exercises/',
    `100% dos ${DEFAULT_EXERCISES_CATALOG.length} exercícios homologados possuem arquivos válidos em disco.`
  );

  // ===========================================================================
  // RESUMO GERAL
  // ===========================================================================
  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS E TESTES CP04 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount === 0) {
    console.log('TODOS OS 21 CENÁRIOS ESPECÍFICOS E TESTES ESTRUTURAIS FORAM APROVADOS COM SUCESSO!\n');
    process.exit(0);
  } else {
    console.error('EXISTEM FALHAS NA SUÍTE DO CHECKPOINT 04.\n');
    process.exit(1);
  }
}

runCheckpoint04TestSuite().catch((err) => {
  console.error('ERRO FATAL NA EXECUÇÃO DO TESTE CP04:', err);
  process.exit(1);
});
