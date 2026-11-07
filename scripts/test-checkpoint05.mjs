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
  calculateActiveWeeksStreak,
  calculateExerciseEvolution,
  calculateOverallEvolutionMetrics,
  calculatePersonalRecords,
  compareBodyAssessments,
  exportEvolutionReportCsv,
  exportEvolutionReportJson,
  filterCompletedSessions,
  normalizeCompletedSessions,
} from '../src/utils/evolutionCalculator.ts';

// Configuração de ambiente para testes
const memoryStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => (memoryStorage.has(key) ? memoryStorage.get(key) : null),
  setItem: (key, val) => memoryStorage.set(key, String(val)),
  removeItem: (key) => memoryStorage.delete(key),
  clear: () => memoryStorage.clear(),
};
globalThis.window = globalThis;

console.log('================================================================================');
console.log('TREINO CERTO — AUDITORIA TÉCNICA E TESTES DE REGRESSÃO CP05');
console.log('Evolução Física, Acompanhamento de Desempenho, Medidas Corporais e Recordes');
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

async function runCheckpoint05TestSuite() {
  const idbFactory = new IDBFactory();
  const db = new FitAppDB(idbFactory);

  // ===========================================================================
  // BLOCO 1: MEDIDAS CORPORAIS E STORE BODY_MEASUREMENTS
  // ===========================================================================
  console.log('--- BLOCO 1: AVALIAÇÃO FÍSICA E MEDIDAS CORPORAIS (STORE BODY_MEASUREMENTS) ---');

  // Teste 01: Criação de avaliação física com medidas reais
  const assessment01 = {
    id: 'measurement_2026_10_01',
    date: '2026-10-01',
    weightKg: 84.5,
    waistCm: 88.0,
    abdomenCm: 92.5,
    chestCm: 104.0,
    armRightCm: 38.5,
    armLeftCm: 38.0,
    thighRightCm: 60.5,
    thighLeftCm: 60.0,
    calfRightCm: 39.0,
    calfLeftCm: 39.0,
    notes: 'Avaliação inicial pré-treinamento.',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
  };

  await db.saveBodyMeasurement(assessment01);
  const fetched01 = await db.getBodyMeasurement('measurement_2026_10_01');

  assert(
    fetched01 !== null &&
      fetched01.weightKg === 84.5 &&
      fetched01.waistCm === 88.0 &&
      fetched01.armRightCm === 38.5,
    'CENÁRIO 01',
    'Cadastro de avaliação física no IndexedDB (store body_measurements)',
    `Gravado: Peso=${fetched01?.weightKg}kg, Cintura=${fetched01?.waistCm}cm, Braço D=${fetched01?.armRightCm}cm`
  );

  // Teste 02: Cadastro de segunda avaliação e ordenação cronológica decrescente
  const assessment02 = {
    id: 'measurement_2026_11_01',
    date: '2026-11-01',
    weightKg: 82.5,
    waistCm: 85.0,
    abdomenCm: 89.0,
    chestCm: 105.5,
    armRightCm: 39.5,
    armLeftCm: 39.2,
    thighRightCm: 61.5,
    thighLeftCm: 61.2,
    calfRightCm: 39.5,
    calfLeftCm: 39.5,
    notes: 'Reavaliação após 30 dias de treino consistente.',
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  };

  await db.saveBodyMeasurement(assessment02);
  const allAssessments = await db.getBodyMeasurements();

  assert(
    allAssessments.length === 2 &&
      allAssessments[0].id === 'measurement_2026_11_01' &&
      allAssessments[1].id === 'measurement_2026_10_01',
    'CENÁRIO 02',
    'Consulta e ordenação cronológica decrescente (mais recente primeiro)',
    `Total retornado: ${allAssessments.length}. Primeira da lista: ${allAssessments[0].date}`
  );

  // Teste 03: Edição de avaliação física preservando o ID
  const updatedAssessment01 = {
    ...assessment01,
    weightKg: 84.0,
    notes: 'Avaliação inicial com peso aferido em balança calibrada.',
    updatedAt: '2026-10-02T10:00:00.000Z',
  };

  await db.saveBodyMeasurement(updatedAssessment01);
  const reFetched01 = await db.getBodyMeasurement('measurement_2026_10_01');

  assert(
    reFetched01 !== null &&
      reFetched01.weightKg === 84.0 &&
      reFetched01.notes.includes('balança calibrada'),
    'CENÁRIO 03',
    'Edição de avaliação física preservando integridade dos demais campos',
    `Peso atualizado para ${reFetched01?.weightKg}kg e nota atualizada.`
  );

  // Teste 04: Comparação entre duas avaliações (deltas absolutos e percentuais)
  const comparison = compareBodyAssessments(assessment02, reFetched01);
  const weightComp = comparison.find((c) => c.key === 'weightKg');
  const waistComp = comparison.find((c) => c.key === 'waistCm');
  const armComp = comparison.find((c) => c.key === 'armRightCm');

  assert(
    weightComp?.delta === -1.5 &&
      weightComp?.deltaPercent === -1.8 &&
      waistComp?.delta === -3.0 &&
      armComp?.delta === 1.0,
    'CENÁRIO 04',
    'Comparação matemática exata entre avaliações corporais consecutivas',
    `Variações: Peso=${weightComp?.delta}kg (${weightComp?.deltaPercent}%), Cintura=${waistComp?.delta}cm, Braço D=+${armComp?.delta}cm`
  );

  // Teste 05: Exclusão com confirmação
  const tempAssessment = {
    id: 'measurement_para_exclusao',
    date: '2026-09-15',
    weightKg: 86.0,
    createdAt: '2026-09-15T00:00:00.000Z',
    updatedAt: '2026-09-15T00:00:00.000Z',
  };
  await db.saveBodyMeasurement(tempAssessment);
  const beforeDelete = await db.getBodyMeasurement('measurement_para_exclusao');
  await db.deleteBodyMeasurement('measurement_para_exclusao');
  const afterDelete = await db.getBodyMeasurement('measurement_para_exclusao');

  assert(
    beforeDelete !== null && afterDelete === null,
    'CENÁRIO 05',
    'Exclusão de avaliação física no IndexedDB sem resíduos',
    'Registro excluído formalmente e não mais localizado na consulta.'
  );

  // Teste 06: Persistência após recarga (nova instância de FitAppDB compartilhando factory)
  const reloadedDb = new FitAppDB(idbFactory);
  const reloadedMeasurements = await reloadedDb.getBodyMeasurements();

  assert(
    reloadedMeasurements.length === 2 &&
      reloadedMeasurements.some((m) => m.id === 'measurement_2026_11_01'),
    'CENÁRIO 06',
    'Persistência íntegra de medidas corporais após recarregamento',
    `Recuperadas ${reloadedMeasurements.length} avaliações na nova conexão.`
  );

  // ===========================================================================
  // BLOCO 2: SESSÕES DE TREINO, FILTROS E MÉTRICAS GERAIS
  // ===========================================================================
  console.log('\n--- BLOCO 2: SESSÕES DE TREINO, FILTROS E MÉTRICAS DO PAINEL ---');

  const baseNowMs = new Date('2026-11-06T12:00:00.000Z').getTime();

  // Cria lote de sessões para testes de métricas:
  // - 1 sessão descartada / incompleta (isCompleted: false) -> DEVE SER IGNORADA
  // - 1 sessão concluída duplicada com mesmo ID -> DEVE SER DESDUPLICADA
  // - Sessões concluídas válidas em datas estratégicas
  const mockSessions = [
    // Sessão incompleta / em andamento (deve ser ignorada)
    {
      id: 'session_incompleta_01',
      workoutPlanId: 'plan_1',
      divisionId: 'div_a',
      divisionName: 'Treino A - Peito',
      startTime: '2026-11-05T10:00:00.000Z',
      isCompleted: false,
      exercisesCompleted: 1,
      totalVolumeKg: 1000,
    },
    // Sessão 1: Hoje (2026-11-06)
    {
      id: 'session_cp5_01',
      workoutPlanId: 'plan_1',
      planName: 'Ficha Hipertrofia',
      divisionId: 'div_a',
      divisionName: 'Treino A - Peito e Tríceps',
      startTime: '2026-11-06T09:00:00.000Z',
      endTime: '2026-11-06T10:00:00.000Z',
      elapsedActiveSeconds: 3300, // 55 min
      isCompleted: true,
      exercisesCompleted: 2,
      totalVolumeKg: 3500,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [
            { setNumber: 1, actualReps: 12, actualWeightKg: 60, completed: true },
            { setNumber: 2, actualReps: 10, actualWeightKg: 70, completed: true },
            { setNumber: 3, actualReps: 8, actualWeightKg: 80, completed: true },
            { setNumber: 4, actualReps: 6, actualWeightKg: 90, completed: true }, // Max load 90kg
          ],
        },
        {
          exerciseId: 'ex_triceps_corda_polia',
          exerciseName: 'Tríceps na polia com corda',
          order: 2,
          sets: [
            { setNumber: 1, actualReps: 15, actualWeightKg: 25, completed: true },
            { setNumber: 2, actualReps: 12, actualWeightKg: 30, completed: true },
          ],
        },
      ],
    },
    // Duplicata proposital de session_cp5_01 para testar resiliência
    {
      id: 'session_cp5_01',
      startTime: '2026-11-06T09:00:00.000Z',
      isCompleted: true,
      totalVolumeKg: 3500,
    },
    // Sessão 2: 3 dias atrás (2026-11-03)
    {
      id: 'session_cp5_02',
      workoutPlanId: 'plan_1',
      planName: 'Ficha Hipertrofia',
      divisionId: 'div_b',
      divisionName: 'Treino B - Costas e Bíceps',
      startTime: '2026-11-03T18:00:00.000Z',
      endTime: '2026-11-03T19:05:00.000Z',
      elapsedActiveSeconds: 3600, // 60 min
      isCompleted: true,
      exercisesCompleted: 2,
      totalVolumeKg: 4200,
      exerciseLogs: [
        {
          exerciseId: 'ex_costas_puxada_alta_pronada',
          exerciseName: 'Puxada alta na polia com pegada pronada',
          order: 1,
          sets: [
            { setNumber: 1, actualReps: 12, actualWeightKg: 50, completed: true },
            { setNumber: 2, actualReps: 10, actualWeightKg: 60, completed: true },
            { setNumber: 3, actualReps: 8, actualWeightKg: 70, completed: true },
          ],
        },
        {
          exerciseId: 'ex_biceps_rosca_direta_barra',
          exerciseName: 'Rosca direta com barra',
          order: 2,
          sets: [
            { setNumber: 1, actualReps: 12, actualWeightKg: 25, completed: true },
            { setNumber: 2, actualReps: 10, actualWeightKg: 30, completed: true },
          ],
        },
      ],
    },
    // Sessão 3: 20 dias atrás (2026-10-17)
    {
      id: 'session_cp5_03',
      workoutPlanId: 'plan_1',
      planName: 'Ficha Hipertrofia',
      divisionId: 'div_a',
      divisionName: 'Treino A - Peito e Tríceps',
      startTime: '2026-10-17T09:00:00.000Z',
      endTime: '2026-10-17T09:50:00.000Z',
      elapsedActiveSeconds: 3000, // 50 min
      isCompleted: true,
      exercisesCompleted: 1,
      totalVolumeKg: 2720,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [
            { setNumber: 1, actualReps: 12, actualWeightKg: 55, completed: true },
            { setNumber: 2, actualReps: 10, actualWeightKg: 65, completed: true },
            { setNumber: 3, actualReps: 8, actualWeightKg: 75, completed: true },
            { setNumber: 4, actualReps: 6, actualWeightKg: 82, completed: true }, // Max load 82kg
          ],
        },
      ],
    },
    // Sessão 4: 45 dias atrás (2026-09-22)
    {
      id: 'session_cp5_04',
      workoutPlanId: 'plan_1',
      planName: 'Ficha Hipertrofia',
      divisionId: 'div_c',
      divisionName: 'Treino C - Pernas',
      startTime: '2026-09-22T08:00:00.000Z',
      endTime: '2026-09-22T09:10:00.000Z',
      elapsedActiveSeconds: 4000,
      isCompleted: true,
      exercisesCompleted: 1,
      totalVolumeKg: 5000,
      exerciseLogs: [
        {
          exerciseId: 'ex_quadriceps_agachamento_livre',
          exerciseName: 'Agachamento livre com barra',
          order: 1,
          sets: [
            { setNumber: 1, actualReps: 10, actualWeightKg: 80, completed: true },
            { setNumber: 2, actualReps: 8, actualWeightKg: 100, completed: true },
            { setNumber: 3, actualReps: 6, actualWeightKg: 110, completed: true }, // Max load 110kg
          ],
        },
      ],
    },
  ];

  // Teste 07: Descarte de sessões incompletas e desduplicação
  const filteredCompleted = filterCompletedSessions(mockSessions, 'all', baseNowMs);
  assert(
    filteredCompleted.length === 4 &&
      !filteredCompleted.some((s) => s.id === 'session_incompleta_01'),
    'CENÁRIO 07',
    'Exclusão de sessões incompletas e desduplicação rigorosa de IDs',
    `Das 6 entradas fornecidas (1 incompleta, 1 duplicada), restaram ${filteredCompleted.length} sessões válidas.`
  );

  // Teste 08: Filtro temporal de 7 dias
  const last7DaysSessions = filterCompletedSessions(mockSessions, '7d', baseNowMs);
  assert(
    last7DaysSessions.length === 2 &&
      last7DaysSessions.some((s) => s.id === 'session_cp5_01') &&
      last7DaysSessions.some((s) => s.id === 'session_cp5_02'),
    'CENÁRIO 08',
    'Filtro de período de 7 dias com datas calculadas com exatidão',
    `Sessões no período de 7 dias: ${last7DaysSessions.length} (sessões 01 e 02).`
  );

  // Teste 09: Filtro temporal de 30 dias
  const last30DaysSessions = filterCompletedSessions(mockSessions, '30d', baseNowMs);
  assert(
    last30DaysSessions.length === 3 &&
      last30DaysSessions.some((s) => s.id === 'session_cp5_03'),
    'CENÁRIO 09',
    'Filtro de período de 30 dias incluindo sessões intermediárias',
    `Sessões no período de 30 dias: ${last30DaysSessions.length}.`
  );

  // Teste 10: Métricas agregadas do painel (volume total, duração e treinos)
  const metrics30d = calculateOverallEvolutionMetrics(mockSessions, '30d', baseNowMs);
  assert(
    metrics30d.totalWorkouts === 3 &&
      metrics30d.totalTrainingTimeSeconds === 9900 && // 3300 + 3600 + 3000
      metrics30d.totalVolumeKg > 0,
    'CENÁRIO 10',
    'Cálculo consolidado de treinos concluídos, tempo acumulado e volume',
    `Total treinos: ${metrics30d.totalWorkouts}, Tempo total: ${metrics30d.totalTrainingTimeSeconds}s (${Math.round(metrics30d.totalTrainingTimeSeconds / 60)} min), Volume: ${metrics30d.totalVolumeKg}kg`
  );

  // Teste 11: Sequência de semanas com treinos (streak)
  const streak = calculateActiveWeeksStreak(filteredCompleted, baseNowMs);
  assert(
    streak >= 1,
    'CENÁRIO 11',
    'Cálculo de sequência de semanas consecutivas com treinos ativos (streak)',
    `Sequência calculada: ${streak} semanas consecutivas com presença.`
  );

  // ===========================================================================
  // BLOCO 3: EVOLUÇÃO DE DESEMPENHO E PROGRESSÃO DE CARGAS
  // ===========================================================================
  console.log('\n--- BLOCO 3: EVOLUÇÃO DE DESEMPENHO E SOBRECARGA PROGRESSIVA ---');

  // Teste 12: Análise por exercício para Supino Reto com Barra
  const benchEvolution = calculateExerciseEvolution(
    'ex_peito_supino_reto_barra',
    filteredCompleted,
    baseNowMs
  );

  assert(
    benchEvolution.sessionsCount === 2 &&
      benchEvolution.allTimeMaxWeightKg === 90 &&
      benchEvolution.loadProgressionKg === 8, // 90kg na sessão recente - 82kg na anterior
    'CENÁRIO 12',
    'Sobrecarga progressiva e histórico de cargas por exercício',
    `Sessões: ${benchEvolution.sessionsCount}, Carga máxima histórica: ${benchEvolution.allTimeMaxWeightKg}kg, Progressão vs sessão anterior: +${benchEvolution.loadProgressionKg}kg`
  );

  // Teste 13: Detalhamento de séries, repetições e volume por série
  const lastBenchSession = benchEvolution.lastSession;
  assert(
    lastBenchSession !== null &&
      lastBenchSession.completedSetsCount === 4 &&
      lastBenchSession.sets[3].actualWeightKg === 90 &&
      lastBenchSession.sets[3].actualReps === 6,
    'CENÁRIO 13',
    'Detalhamento fidedigno de séries, repetições e cargas individuais',
    `Série 4: ${lastBenchSession?.sets[3].actualWeightKg}kg × ${lastBenchSession?.sets[3].actualReps} reps (Volume=${lastBenchSession?.sets[3].volumeKg}kg)`
  );

  // Teste 14: Segregação e não contaminação entre exercícios distintos
  const squatEvolution = calculateExerciseEvolution(
    'ex_quadriceps_agachamento_livre',
    filteredCompleted,
    baseNowMs
  );

  assert(
    squatEvolution.sessionsCount === 1 &&
      squatEvolution.allTimeMaxWeightKg === 110 &&
      squatEvolution.allTimeMaxWeightKg !== benchEvolution.allTimeMaxWeightKg,
    'CENÁRIO 14',
    'Segregação estrita entre exercícios biomecanicamente distintos',
    `Agachamento: ${squatEvolution.allTimeMaxWeightKg}kg (1 sessão), Supino: ${benchEvolution.allTimeMaxWeightKg}kg (2 sessões)`
  );

  // ===========================================================================
  // BLOCO 4: RECORDES PESSOAIS (PRs)
  // ===========================================================================
  console.log('\n--- BLOCO 4: RECORDES PESSOAIS (PRs) ---');

  // Teste 15: Identificação da maior carga levantada globalmente
  const prs = calculatePersonalRecords(filteredCompleted, baseNowMs);
  const globalWeightPr = prs.find((p) => p.type === 'max_weight' && p.id.includes('global'));

  assert(
    globalWeightPr !== undefined &&
      globalWeightPr.numericValue === 110 &&
      globalWeightPr.exerciseName.includes('Agachamento'),
    'CENÁRIO 15',
    'Identificação de Recorde Pessoal de maior carga levantada',
    `Recorde Global: ${globalWeightPr?.exerciseName} com ${globalWeightPr?.valueDisplay}`
  );

  // Teste 16: Identificação de maior volume em uma sessão
  const volumePr = prs.find((p) => p.type === 'max_session_volume');
  assert(
    volumePr !== undefined &&
      volumePr.numericValue > 0,
    'CENÁRIO 16',
    'Identificação de Recorde Pessoal de maior volume em sessão única',
    `Maior volume de sessão: ${volumePr?.valueDisplay} (${volumePr?.subtitle})`
  );

  // Teste 17: Estado vazio de recordes quando não há histórico
  const emptyPrs = calculatePersonalRecords([], baseNowMs);
  assert(
    emptyPrs.length === 0,
    'CENÁRIO 17',
    'Estado vazio informativo na ausência de sessões concluídas',
    `Total de recordes com base zerada: ${emptyPrs.length} (nenhum dado inventado/estimado).`
  );

  // ===========================================================================
  // BLOCO 5: EXPORTAÇÃO E COMPATIBILIDADE DE BACKUP
  // ===========================================================================
  console.log('\n--- BLOCO 5: EXPORTAÇÃO, RELATÓRIOS E INTEGRIDADE DE BACKUP ---');

  // Teste 18: Exportação de relatório em JSON
  const jsonReport = exportEvolutionReportJson(filteredCompleted, allAssessments, baseNowMs);
  const parsedJson = JSON.parse(jsonReport);

  assert(
    parsedJson.app === 'TREINO CERTO' &&
      parsedJson.completedSessions.length === 4 &&
      parsedJson.bodyMeasurements.length === 2,
    'CENÁRIO 18',
    'Geração de relatório JSON com histórico completo e avaliações físicas',
    `JSON válido: ${parsedJson.completedSessions.length} sessões e ${parsedJson.bodyMeasurements.length} avaliações.`
  );

  // Teste 19: Exportação de relatório em CSV
  const csvReport = exportEvolutionReportCsv(filteredCompleted, allAssessments, baseNowMs);
  assert(
    csvReport.includes('--- SESSÕES DE TREINO CONCLUÍDAS ---') &&
      csvReport.includes('--- HISTÓRICO DE MEDIDAS CORPORAIS ---') &&
      csvReport.includes('Supino reto com barra') &&
      csvReport.includes('84.5'),
    'CENÁRIO 19',
    'Geração de relatório CSV formatado e compatível com planilhas',
    `CSV gerado com ${csvReport.split('\n').length} linhas estruturadas.`
  );

  // Teste 20: Backup geral das 7 tabelas com preservação de body_measurements
  // Salva planos e sessões reais no DB de teste
  for (const s of filteredCompleted) {
    await db.saveWorkoutSession(s);
  }
  const fullBackupJson = await db.exportAllData();
  const backupValidation = db.validateBackupString(fullBackupJson);

  assert(
    backupValidation.isValid &&
      backupValidation.details?.recordCounts.body_measurements === 2 &&
      backupValidation.details?.recordCounts.workout_sessions === 4,
    'CENÁRIO 20',
    'Exportação e validação consistente do backup oficial incluindo body_measurements',
    `Backup validado com 7 tabelas oficiais. body_measurements: ${backupValidation.details?.recordCounts.body_measurements}`
  );

  // Teste 21: Preservação de integridade dos 48 exercícios e imagens WebP
  let missingFiles = 0;
  for (const ex of DEFAULT_EXERCISES_CATALOG) {
    const expectedPath = `public/images/exercises/${ex.id}.webp`;
    if (!fs.existsSync(expectedPath)) {
      missingFiles++;
    }
  }

  assert(
    DEFAULT_EXERCISES_CATALOG.length >= 48 && missingFiles === 0,
    'CENÁRIO 21',
    'Preservação integral dos exercícios e imagens 3D WebP homologadas',
    `Total de exercícios: ${DEFAULT_EXERCISES_CATALOG.length} | Imagens ausentes: ${missingFiles}`
  );

  // ===========================================================================
  // BLOCO 6: NORMALIZAÇÃO CENTRAL, FREQUÊNCIA "ALL" E RESISTÊNCIA A DADOS SUJOS
  // ===========================================================================
  console.log('\n--- BLOCO 6: NORMALIZAÇÃO CENTRAL, PERÍODO "ALL", COMPARAÇÕES E EXPORTAÇÕES ---');

  // Conjunto de histórico sujo chamado diretamente nas funções sem filterCompletedSessions prévio:
  // - 6 sessões válidas ao longo de 60 dias (2 meses)
  // - 1 sessão duplicada (mesmo ID de uma válida da semana atual)
  // - 1 sessão incompleta (isCompleted: false)
  // - 1 sessão com data inválida ("data-invalida-xyz")
  // - 1 sessão futura (no ano 2027)
  // - 1 sessão com ID vazio
  // - 2 sessões válidas no período anterior de 30 dias (entre 31 e 59 dias atrás) + 1 duplicada delas
  const dirtyHistory = [
    // Válida 1: Hoje (2026-11-06) - Volume: 1000kg, Duração: 3000s
    {
      id: 'valid_sess_1',
      workoutPlanId: 'p1',
      planName: 'Ficha A',
      divisionId: 'd1',
      divisionName: 'Treino A',
      startTime: '2026-11-06T10:00:00.000Z',
      elapsedActiveSeconds: 3000,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 100, completed: true }],
        },
      ],
    },
    // Duplicata de valid_sess_1 (com valores inflados para provar que não soma duas vezes nem altera PR)
    {
      id: 'valid_sess_1',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Treino A Duplicado',
      startTime: '2026-11-06T10:00:00.000Z',
      elapsedActiveSeconds: 9999,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 500, completed: true }],
        },
      ],
    },
    // Válida 2: 2 dias atrás (2026-11-04, mesma semana) - Volume: 800kg, Duração: 2400s
    {
      id: 'valid_sess_2',
      workoutPlanId: 'p1',
      planName: 'Ficha A',
      divisionId: 'd2',
      divisionName: 'Treino B',
      startTime: '2026-11-04T10:00:00.000Z',
      elapsedActiveSeconds: 2400,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 80, completed: true }],
        },
      ],
    },
    // Válida 3: 10 dias atrás (2026-10-27, semana anterior) - Volume: 900kg, Duração: 2700s
    {
      id: 'valid_sess_3',
      workoutPlanId: 'p1',
      planName: 'Ficha A',
      divisionId: 'd1',
      divisionName: 'Treino A',
      startTime: '2026-10-27T10:00:00.000Z',
      elapsedActiveSeconds: 2700,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 90, completed: true }],
        },
      ],
    },
    // Válida 4: 40 dias atrás (2026-09-27, período anterior aos 30d) - Volume: 700kg, Duração: 2100s
    {
      id: 'valid_sess_4',
      workoutPlanId: 'p1',
      planName: 'Ficha A',
      divisionId: 'd1',
      divisionName: 'Treino A',
      startTime: '2026-09-27T10:00:00.000Z',
      elapsedActiveSeconds: 2100,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 70, completed: true }],
        },
      ],
    },
    // Duplicata de valid_sess_4 no período anterior (para testar não duplicação na comparação de períodos)
    {
      id: 'valid_sess_4',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Treino A',
      startTime: '2026-09-27T10:00:00.000Z',
      elapsedActiveSeconds: 2100,
      isCompleted: true,
      totalVolumeKg: 700,
    },
    // Válida 5: 60 dias atrás (2026-09-07, exatos 60 dias antes de 2026-11-06) - Volume: 600kg, Duração: 1800s
    {
      id: 'valid_sess_5',
      workoutPlanId: 'p1',
      planName: 'Ficha A',
      divisionId: 'd1',
      divisionName: 'Treino A',
      startTime: '2026-09-07T12:00:00.000Z',
      elapsedActiveSeconds: 1800,
      isCompleted: true,
      exercisesCompleted: 1,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 60, completed: true }],
        },
      ],
    },
    // Inválida A: Sessão incompleta
    {
      id: 'invalid_incomplete',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Incompleta',
      startTime: '2026-11-05T10:00:00.000Z',
      elapsedActiveSeconds: 5000,
      isCompleted: false,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 300, completed: true }],
        },
      ],
    },
    // Inválida B: Data inválida
    {
      id: 'invalid_date',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Data Corrompida',
      startTime: 'data-invalida-xyz',
      elapsedActiveSeconds: 4000,
      isCompleted: true,
      totalVolumeKg: 9000,
    },
    // Inválida C: Sessão futura (2027)
    {
      id: 'invalid_future',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Sessão no Futuro',
      startTime: '2027-05-01T10:00:00.000Z',
      elapsedActiveSeconds: 4000,
      isCompleted: true,
      exerciseLogs: [
        {
          exerciseId: 'ex_peito_supino_reto_barra',
          exerciseName: 'Supino reto com barra',
          order: 1,
          sets: [{ setNumber: 1, actualReps: 10, actualWeightKg: 400, completed: true }],
        },
      ],
    },
    // Inválida D: ID vazio
    {
      id: '   ',
      workoutPlanId: 'p1',
      divisionId: 'd1',
      divisionName: 'Sem ID',
      startTime: '2026-11-02T10:00:00.000Z',
      isCompleted: true,
      totalVolumeKg: 2000,
    },
  ];

  // Teste 22: Função central normalizeCompletedSessions filtra todos os casos inválidos
  const normalizedDirty = normalizeCompletedSessions(dirtyHistory, baseNowMs);
  assert(
    normalizedDirty.length === 5 &&
      normalizedDirty.every((s) => s.id.startsWith('valid_sess_')),
    'CENÁRIO 22',
    'Normalização central (normalizeCompletedSessions) rejeita duplicadas, incompletas, datas inválidas, IDs vazios e sessões futuras',
    `De ${dirtyHistory.length} registros brutos, apenas as ${normalizedDirty.length} sessões genuinamente válidas permaneceram.`
  );

  // Teste 23: Chamada direta a calculateOverallEvolutionMetrics (30d) com histórico sujo
  // Válidas nos últimos 30d: valid_sess_1 (1000kg, 3000s), valid_sess_2 (800kg, 2400s), valid_sess_3 (900kg, 2700s) -> Total 3 treinos, 2700kg, 8100s
  // Válidas na semana atual (a partir de seg 2026-11-02): valid_sess_1 e valid_sess_2 -> 2 treinos
  // Válidas no período anterior de 30d (30 a 60 dias atrás, inclusivo em 60d): valid_sess_4 (700kg, 2100s) e valid_sess_5 (600kg, 1800s) -> 2 treinos, 1300kg (a duplicata de valid_sess_4 foi ignorada)
  const dirtyMetrics30d = calculateOverallEvolutionMetrics(dirtyHistory, '30d', baseNowMs);
  assert(
    dirtyMetrics30d.totalWorkouts === 3 &&
      dirtyMetrics30d.totalVolumeKg === 2700 &&
      dirtyMetrics30d.totalTrainingTimeSeconds === 8100 &&
      dirtyMetrics30d.currentWeekWorkouts === 2 &&
      dirtyMetrics30d.comparison.previousWorkouts === 2 &&
      dirtyMetrics30d.comparison.previousVolumeKg === 1300 &&
      dirtyMetrics30d.comparison.workoutsDelta === 1,
    'CENÁRIO 23',
    'calculateOverallEvolutionMetrics chamado diretamente com histórico sujo não soma duplicatas nem contabiliza futuras/incompletas na semana ou comparação',
    `Treinos 30d: ${dirtyMetrics30d.totalWorkouts} (Vol=${dirtyMetrics30d.totalVolumeKg}kg, Dur=${dirtyMetrics30d.totalTrainingTimeSeconds}s) | Semana atual: ${dirtyMetrics30d.currentWeekWorkouts} | Período anterior: ${dirtyMetrics30d.comparison.previousWorkouts} (${dirtyMetrics30d.comparison.previousVolumeKg}kg)`
  );

  // Teste 24: Frequência semanal e mensal no filtro "all" considerando o intervalo real (60 dias = 2 meses, ~8.57 semanas)
  // 5 sessões em 60 dias:
  // - Frequência mensal: 5 / (60 / 30) = 5 / 2 = 2.5 treinos/mês
  // - Frequência semanal: 5 / (60 / 7) = 5 / 8.5714 = 0.6 treinos/semana
  const dirtyMetricsAll = calculateOverallEvolutionMetrics(dirtyHistory, 'all', baseNowMs);
  assert(
    dirtyMetricsAll.totalWorkouts === 5 &&
      dirtyMetricsAll.monthlyFrequency === 2.5 &&
      dirtyMetricsAll.weeklyFrequency === 0.6 &&
      dirtyMetricsAll.totalVolumeKg === 4000,
    'CENÁRIO 24',
    'Frequência semanal e mensal no filtro "all" calculada pelo intervalo real desde a primeira sessão válida (60 dias / 2 meses)',
    `Total: ${dirtyMetricsAll.totalWorkouts} sessões em 60 dias -> Mensal: ${dirtyMetricsAll.monthlyFrequency}/mês, Semanal: ${dirtyMetricsAll.weeklyFrequency}/sem`
  );

  // Teste 25: Filtro "all" com apenas uma sessão e com histórico vazio
  const singleSessionMetricsAll = calculateOverallEvolutionMetrics(
    [dirtyHistory[0]],
    'all',
    baseNowMs
  );
  const emptyMetricsAll = calculateOverallEvolutionMetrics([], 'all', baseNowMs);
  assert(
    singleSessionMetricsAll.totalWorkouts === 1 &&
      singleSessionMetricsAll.weeklyFrequency === 1 &&
      singleSessionMetricsAll.monthlyFrequency === 1 &&
      emptyMetricsAll.totalWorkouts === 0 &&
      emptyMetricsAll.weeklyFrequency === 0 &&
      emptyMetricsAll.monthlyFrequency === 0,
    'CENÁRIO 25',
    'Tratamento correto de histórico vazio e de sessão única no período "all" (sem divisão por zero ou distorção)',
    `Sessão única: semanal=${singleSessionMetricsAll.weeklyFrequency}, mensal=${singleSessionMetricsAll.monthlyFrequency} | Vazio: semanal=${emptyMetricsAll.weeklyFrequency}, mensal=${emptyMetricsAll.monthlyFrequency}`
  );

  // Teste 26: Chamada direta a calculateActiveWeeksStreak, calculateExerciseEvolution e calculatePersonalRecords com histórico sujo
  const dirtyStreak = calculateActiveWeeksStreak(dirtyHistory, baseNowMs);
  const dirtyExEvo = calculateExerciseEvolution(
    'ex_peito_supino_reto_barra',
    dirtyHistory,
    baseNowMs
  );
  const dirtyPrs = calculatePersonalRecords(dirtyHistory, baseNowMs);
  const dirtyMaxWeightPr = dirtyPrs.find((p) => p.type === 'max_weight');

  assert(
    dirtyStreak === 2 &&
      dirtyExEvo.sessionsCount === 5 &&
      dirtyExEvo.allTimeMaxWeightKg === 100 && // Ignora 500kg da duplicata, 300kg da incompleta e 400kg da futura
      dirtyMaxWeightPr?.numericValue === 100,
    'CENÁRIO 26',
    'Streak, evolução por exercício e recordes pessoais chamados diretamente ignoram cargas de sessões duplicadas, incompletas e futuras',
    `Streak: ${dirtyStreak} semanas | Sessões exercício: ${dirtyExEvo.sessionsCount} | PR Carga: ${dirtyMaxWeightPr?.valueDisplay}`
  );

  // Teste 27: Exportação JSON e CSV chamadas diretamente com histórico sujo exportam exatamente as sessões únicas concluídas
  const dirtyJsonStr = exportEvolutionReportJson(dirtyHistory, allAssessments, baseNowMs);
  const dirtyJsonObj = JSON.parse(dirtyJsonStr);
  const dirtyCsvStr = exportEvolutionReportCsv(dirtyHistory, allAssessments, baseNowMs);

  // Conta quantas linhas de dados de sessões foram geradas no CSV (1 série por sessão válida = 5 linhas)
  const csvLines = dirtyCsvStr.split('\n');
  const validSessRowsInCsv = csvLines.filter((l) => l.startsWith('"valid_sess_')).length;
  const invalidRowsInCsv = csvLines.filter((l) => l.includes('invalid_')).length;

  assert(
    dirtyJsonObj.summary.totalCompletedWorkouts === 5 &&
      dirtyJsonObj.completedSessions.length === 5 &&
      dirtyCsvStr.includes('Total_Sessoes_Unicas_Concluidas: 5') &&
      validSessRowsInCsv === 5 &&
      invalidRowsInCsv === 0,
    'CENÁRIO 27',
    'Exportações JSON e CSV aplicam internamente a normalização central e garantem correspondência exata com as sessões únicas concluídas',
    `JSON completedSessions: ${dirtyJsonObj.completedSessions.length} | CSV sessões únicas: ${validSessRowsInCsv} | Inválidas exportadas: ${invalidRowsInCsv}`
  );

  // ===========================================================================
  // RESUMO GERAL
  // ===========================================================================
  console.log('\n================================================================================');
  console.log(`TOTAL DE CENÁRIOS E TESTES CP05 EXECUTADOS: ${passCount + failCount}`);
  console.log(`APROVADOS: ${passCount} | FALHAS: ${failCount}`);
  console.log('================================================================================');

  if (failCount > 0) {
    console.error('\nATENÇÃO: Houve falhas na homologação do CP05.');
    process.exit(1);
  } else {
    console.log(`\nTODOS OS ${passCount} CENÁRIOS ESPECÍFICOS DO CP05 FORAM APROVADOS COM SUCESSO!\n`);
    process.exit(0);
  }
}

runCheckpoint05TestSuite().catch((err) => {
  console.error('Erro fatal na execução dos testes CP05:', err);
  process.exit(1);
});
