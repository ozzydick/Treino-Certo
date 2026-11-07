/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BodyMeasurementItem,
  EvolutionTimeRange,
  WorkoutSessionItem,
} from '../types';

export interface VolumePoint {
  date: string;
  displayDate: string;
  volumeKg: number;
  sessionCount: number;
  divisionNames: string[];
}

export interface PeriodComparison {
  currentWorkouts: number;
  previousWorkouts: number;
  workoutsDelta: number;
  currentVolumeKg: number;
  previousVolumeKg: number;
  volumeDeltaKg: number;
  volumeDeltaPercent: number;
  currentDurationSeconds: number;
  previousDurationSeconds: number;
  durationDeltaSeconds: number;
}

export interface OverallEvolutionMetrics {
  totalWorkouts: number;
  totalTrainingTimeSeconds: number;
  totalVolumeKg: number;
  weeklyFrequency: number;
  currentWeekWorkouts: number;
  monthlyFrequency: number;
  activeWeeksStreak: number;
  volumeOverTime: VolumePoint[];
  comparison: PeriodComparison;
}

export interface ExerciseSessionLogSummary {
  sessionId: string;
  date: string;
  displayDate: string;
  divisionName: string;
  maxWeightKg: number;
  totalVolumeKg: number;
  totalReps: number;
  completedSetsCount: number;
  sets: Array<{
    setNumber: number;
    actualReps: number;
    actualWeightKg: number;
    volumeKg: number;
  }>;
}

export interface ExerciseEvolutionSummary {
  exerciseId: string;
  exerciseName: string;
  sessionsCount: number;
  allTimeMaxWeightKg: number;
  allTimeMaxVolumeSessionKg: number;
  allTimeMaxRepsWithWeight: { reps: number; weightKg: number; date: string } | null;
  history: ExerciseSessionLogSummary[];
  lastSession: ExerciseSessionLogSummary | null;
  previousSession: ExerciseSessionLogSummary | null;
  loadProgressionKg: number; // delta between last and previous max weight
  volumeProgressionKg: number; // delta between last and previous session volume
}

export interface PersonalRecordItem {
  id: string;
  type: 'max_weight' | 'max_session_volume' | 'max_reps_with_weight';
  title: string;
  subtitle: string;
  exerciseId?: string;
  exerciseName: string;
  valueDisplay: string;
  numericValue: number;
  date: string;
  displayDate: string;
  divisionName?: string;
}

export interface MeasurementComparisonMetric {
  key: keyof BodyMeasurementItem;
  label: string;
  unit: string;
  currentVal?: number;
  prevVal?: number;
  delta?: number;
  deltaPercent?: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Fonte única e autoritativa de normalização de sessões efetivamente concluídas.
 * Critérios:
 * - Objeto válido (não nulo e não array).
 * - ID string não vazia.
 * - isCompleted === true (exclui incompletas e descartadas).
 * - Data de início válida (startTime parseável em timestamp finito).
 * - Sessão não futura (sessionTime <= nowMs).
 * - Apenas uma ocorrência por ID (desduplicação estrita).
 */
export function normalizeCompletedSessions(
  sessions: WorkoutSessionItem[],
  nowMs: number = Date.now()
): WorkoutSessionItem[] {
  if (!Array.isArray(sessions)) return [];

  const seenIds = new Set<string>();
  const normalized: WorkoutSessionItem[] = [];

  for (const s of sessions) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) continue;
    if (typeof s.id !== 'string' || s.id.trim() === '') continue;

    const cleanId = s.id.trim();
    if (seenIds.has(cleanId)) continue;

    if (s.isCompleted !== true) continue;
    if (typeof s.startTime !== 'string' || s.startTime.trim() === '') continue;

    const sessionTime = new Date(s.startTime).getTime();
    if (isNaN(sessionTime) || !Number.isFinite(sessionTime)) continue;

    // Sessões futuras não são contabilizadas
    if (sessionTime > nowMs) continue;

    seenIds.add(cleanId);
    normalized.push(s);
  }

  return normalized;
}

/**
 * Filtra sessões efetivamente concluídas (CP04) aplicando normalização central
 * e recorte pelo período selecionado.
 */
export function filterCompletedSessions(
  sessions: WorkoutSessionItem[],
  timeRange: EvolutionTimeRange = 'all',
  nowMs: number = Date.now()
): WorkoutSessionItem[] {
  const validCompleted = normalizeCompletedSessions(sessions, nowMs);

  if (timeRange === 'all') return validCompleted;

  const rangeDaysMap: Record<Exclude<EvolutionTimeRange, 'all'>, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '12m': 365,
  };

  const days = rangeDaysMap[timeRange] || 30;
  const thresholdMs = nowMs - days * MS_PER_DAY;

  return validCompleted.filter((s) => {
    const sessionTime = new Date(s.startTime).getTime();
    return sessionTime >= thresholdMs && sessionTime <= nowMs;
  });
}

/**
 * Calcula número de semanas ativas consecutivas (streak de semanas com treino).
 * Aplica internamente normalizeCompletedSessions para garantir sessões únicas,
 * válidas e não futuras.
 */
export function calculateActiveWeeksStreak(
  completedSessions: WorkoutSessionItem[],
  nowMs: number = Date.now()
): number {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);
  if (validSessions.length === 0) return 0;

  // Cria chave 'YYYY-Www' para cada sessão válida
  const sessionWeeks = new Set<string>();
  for (const s of validSessions) {
    const d = new Date(s.startTime);
    sessionWeeks.add(getWeekKey(d));
  }

  // Percorre semanas para trás a partir da semana atual
  let streak = 0;
  const curr = new Date(nowMs);
  let weekKey = getWeekKey(curr);

  // Se a semana atual ainda não tem treino, confere se a semana anterior teve
  if (!sessionWeeks.has(weekKey)) {
    const prevWeek = new Date(curr.getTime() - 7 * MS_PER_DAY);
    const prevKey = getWeekKey(prevWeek);
    if (!sessionWeeks.has(prevKey)) {
      return 0;
    }
    // Começa da semana passada
    curr.setTime(prevWeek.getTime());
    weekKey = prevKey;
  }

  while (sessionWeeks.has(weekKey)) {
    streak++;
    curr.setTime(curr.getTime() - 7 * MS_PER_DAY);
    weekKey = getWeekKey(curr);
  }

  return streak;
}

function getWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Calcula volume real de uma sessão concluída.
 */
function computeSessionVolumeKg(s: WorkoutSessionItem): number {
  if (s.exerciseLogs && Array.isArray(s.exerciseLogs)) {
    let vol = 0;
    for (const ex of s.exerciseLogs) {
      if (ex.skipped || !ex.sets) continue;
      for (const st of ex.sets) {
        if (st.completed && st.actualWeightKg > 0 && st.actualReps > 0) {
          vol += st.actualWeightKg * st.actualReps;
        }
      }
    }
    return vol;
  }
  return s.totalVolumeKg || 0;
}

/**
 * Calcula métricas agregadas do painel de evolução geral.
 * Aplica internamente normalizeCompletedSessions para desduplicar e validar
 * todas as sessões antes de qualquer cálculo.
 */
export function calculateOverallEvolutionMetrics(
  allCompletedSessions: WorkoutSessionItem[],
  timeRange: EvolutionTimeRange = '30d',
  nowMs: number = Date.now()
): OverallEvolutionMetrics {
  const normalizedAll = normalizeCompletedSessions(allCompletedSessions, nowMs);
  const filtered = filterCompletedSessions(normalizedAll, timeRange, nowMs);

  let totalTrainingTimeSeconds = 0;
  let totalVolumeKg = 0;

  // Agrupamento de volume por data (YYYY-MM-DD)
  const volumeMap = new Map<
    string,
    { volumeKg: number; count: number; divisions: Set<string> }
  >();

  for (const s of filtered) {
    const duration = s.elapsedActiveSeconds || s.durationSeconds || 0;
    totalTrainingTimeSeconds += duration;

    const sessionVol = computeSessionVolumeKg(s);
    totalVolumeKg += sessionVol;

    const dateKey = s.startTime.split('T')[0] || s.startTime.slice(0, 10);
    const existing = volumeMap.get(dateKey) || {
      volumeKg: 0,
      count: 0,
      divisions: new Set<string>(),
    };
    existing.volumeKg += sessionVol;
    existing.count += 1;
    if (s.divisionName) existing.divisions.add(s.divisionName);
    volumeMap.set(dateKey, existing);
  }

  // Gera pontos ordenados cronologicamente para gráficos
  const volumeOverTime: VolumePoint[] = Array.from(volumeMap.entries())
    .map(([date, data]) => {
      const parts = date.split('-');
      const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : date;
      return {
        date,
        displayDate,
        volumeKg: data.volumeKg,
        sessionCount: data.count,
        divisionNames: Array.from(data.divisions),
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Frequência semanal: treinos na semana corrente (a partir das sessões já normalizadas e únicas)
  const currDate = new Date(nowMs);
  const dayOfWeek = (currDate.getDay() + 6) % 7; // Seg = 0, Dom = 6
  const mondayMs = nowMs - dayOfWeek * MS_PER_DAY;
  const mondayMidnight = new Date(mondayMs);
  mondayMidnight.setHours(0, 0, 0, 0);

  const currentWeekWorkouts = normalizedAll.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t >= mondayMidnight.getTime() && t <= nowMs;
  }).length;

  // Cálculo do intervalo em dias para frequência semanal e mensal:
  // - Quando timeRange === 'all', considera o intervalo real entre a primeira sessão válida e nowMs
  //   (mínimo de 1 semana / 1 mês para intervalos inferiores a uma semana ou mês, ou 0 se histórico vazio).
  // - Para os períodos definidos ('7d', '30d', '90d', '6m', '12m'), mantém os respectivos intervalos.
  let daysInPeriod = 30;
  let weeklyFrequency = 0;
  let monthlyFrequency = 0;

  if (timeRange === 'all') {
    if (filtered.length === 0) {
      daysInPeriod = 30;
      weeklyFrequency = 0;
      monthlyFrequency = 0;
    } else {
      let earliestMs = nowMs;
      for (const s of filtered) {
        const t = new Date(s.startTime).getTime();
        if (t < earliestMs) earliestMs = t;
      }
      const spanDays = Math.max(1, (nowMs - earliestMs) / MS_PER_DAY);
      daysInPeriod = spanDays;

      const weeksInAll = Math.max(1, spanDays / 7);
      const monthsInAll = Math.max(1, spanDays / 30);

      weeklyFrequency = Number((filtered.length / weeksInAll).toFixed(1));
      monthlyFrequency = Number((filtered.length / monthsInAll).toFixed(1));
    }
  } else {
    daysInPeriod =
      timeRange === '7d'
        ? 7
        : timeRange === '30d'
        ? 30
        : timeRange === '90d'
        ? 90
        : timeRange === '6m'
        ? 180
        : 365;

    const weeksInPeriod = Math.max(1, daysInPeriod / 7);
    weeklyFrequency = Number((filtered.length / weeksInPeriod).toFixed(1));

    const monthsInPeriod = Math.max(1, daysInPeriod / 30);
    monthlyFrequency = Number((filtered.length / monthsInPeriod).toFixed(1));
  }

  const activeWeeksStreak = calculateActiveWeeksStreak(normalizedAll, nowMs);

  // Comparação com período imediatamente anterior de mesma duração (usando normalizedAll sem duplicatas)
  const prevPeriodDurationMs = daysInPeriod * MS_PER_DAY;
  const prevPeriodStartMs = nowMs - 2 * prevPeriodDurationMs;
  const prevPeriodEndMs = nowMs - prevPeriodDurationMs;

  const previousSessions =
    timeRange === 'all'
      ? []
      : normalizedAll.filter((s) => {
          const t = new Date(s.startTime).getTime();
          return t >= prevPeriodStartMs && t < prevPeriodEndMs;
        });

  const prevWorkouts = previousSessions.length;
  let prevVolumeKg = 0;
  let prevDurationSec = 0;

  for (const s of previousSessions) {
    prevDurationSec += s.elapsedActiveSeconds || s.durationSeconds || 0;
    prevVolumeKg += computeSessionVolumeKg(s);
  }

  const workoutsDelta = filtered.length - prevWorkouts;
  const volumeDeltaKg = totalVolumeKg - prevVolumeKg;
  const volumeDeltaPercent =
    prevVolumeKg > 0
      ? Number(((volumeDeltaKg / prevVolumeKg) * 100).toFixed(1))
      : totalVolumeKg > 0
      ? 100
      : 0;

  const durationDeltaSeconds = totalTrainingTimeSeconds - prevDurationSec;

  return {
    totalWorkouts: filtered.length,
    totalTrainingTimeSeconds,
    totalVolumeKg,
    weeklyFrequency,
    currentWeekWorkouts,
    monthlyFrequency,
    activeWeeksStreak,
    volumeOverTime,
    comparison: {
      currentWorkouts: filtered.length,
      previousWorkouts: prevWorkouts,
      workoutsDelta,
      currentVolumeKg: totalVolumeKg,
      previousVolumeKg: prevVolumeKg,
      volumeDeltaKg,
      volumeDeltaPercent,
      currentDurationSeconds: totalTrainingTimeSeconds,
      previousDurationSeconds: prevDurationSec,
      durationDeltaSeconds,
    },
  };
}

/**
 * Analisa desempenho detalhado para um exercício específico ao longo do tempo.
 * Aplica internamente normalizeCompletedSessions para garantir sessões únicas e válidas.
 */
export function calculateExerciseEvolution(
  exerciseId: string,
  completedSessions: WorkoutSessionItem[],
  nowMs: number = Date.now()
): ExerciseEvolutionSummary {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);

  const history: ExerciseSessionLogSummary[] = [];
  let exerciseName = '';
  let allTimeMaxWeightKg = 0;
  let allTimeMaxVolumeSessionKg = 0;
  let allTimeMaxRepsWithWeight: { reps: number; weightKg: number; date: string } | null = null;

  for (const s of validSessions) {
    if (!s.exerciseLogs) continue;

    const exLog = s.exerciseLogs.find((l) => l.exerciseId === exerciseId);
    if (!exLog || exLog.skipped || !exLog.sets || exLog.sets.length === 0) continue;

    if (!exerciseName && exLog.exerciseName) {
      exerciseName = exLog.exerciseName;
    }

    let sessionMaxWeight = 0;
    let sessionVolumeKg = 0;
    let sessionTotalReps = 0;
    const completedSets: Array<{
      setNumber: number;
      actualReps: number;
      actualWeightKg: number;
      volumeKg: number;
    }> = [];

    for (const st of exLog.sets) {
      if (!st.completed) continue;

      const weight = Number(st.actualWeightKg) || 0;
      const reps = Number(st.actualReps) || 0;
      const setVol = weight * reps;

      if (weight > sessionMaxWeight) sessionMaxWeight = weight;
      if (weight > allTimeMaxWeightKg) allTimeMaxWeightKg = weight;

      if (weight > 0 && reps > 0) {
        if (
          !allTimeMaxRepsWithWeight ||
          reps > allTimeMaxRepsWithWeight.reps ||
          (reps === allTimeMaxRepsWithWeight.reps && weight > allTimeMaxRepsWithWeight.weightKg)
        ) {
          allTimeMaxRepsWithWeight = { reps, weightKg: weight, date: s.startTime };
        }
      }

      sessionVolumeKg += setVol;
      sessionTotalReps += reps;

      completedSets.push({
        setNumber: st.setNumber,
        actualReps: reps,
        actualWeightKg: weight,
        volumeKg: setVol,
      });
    }

    if (completedSets.length === 0) continue;

    if (sessionVolumeKg > allTimeMaxVolumeSessionKg) {
      allTimeMaxVolumeSessionKg = sessionVolumeKg;
    }

    const d = new Date(s.startTime);
    const displayDate = !isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      : s.startTime;

    history.push({
      sessionId: s.id,
      date: s.startTime,
      displayDate,
      divisionName: s.divisionName || 'Treino',
      maxWeightKg: sessionMaxWeight,
      totalVolumeKg: sessionVolumeKg,
      totalReps: sessionTotalReps,
      completedSetsCount: completedSets.length,
      sets: completedSets,
    });
  }

  // Ordena cronologicamente crescente
  history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lastSession = history.length > 0 ? history[history.length - 1] : null;
  const previousSession = history.length > 1 ? history[history.length - 2] : null;

  const loadProgressionKg =
    lastSession && previousSession ? lastSession.maxWeightKg - previousSession.maxWeightKg : 0;
  const volumeProgressionKg =
    lastSession && previousSession ? lastSession.totalVolumeKg - previousSession.totalVolumeKg : 0;

  return {
    exerciseId,
    exerciseName: exerciseName || exerciseId,
    sessionsCount: history.length,
    allTimeMaxWeightKg,
    allTimeMaxVolumeSessionKg,
    allTimeMaxRepsWithWeight,
    history,
    lastSession,
    previousSession,
    loadProgressionKg,
    volumeProgressionKg,
  };
}

/**
 * Computa recordes pessoais (PRs) verificados e fidedignos a partir das sessões concluídas.
 * Aplica internamente normalizeCompletedSessions para excluir sessões incompletas,
 * descartadas, duplicadas, com data inválida ou futuras.
 */
export function calculatePersonalRecords(
  completedSessions: WorkoutSessionItem[],
  nowMs: number = Date.now()
): PersonalRecordItem[] {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);
  const records: PersonalRecordItem[] = [];

  let highestWeightRecord: PersonalRecordItem | null = null;
  let highestVolumeSessionRecord: PersonalRecordItem | null = null;
  let highestRepsWithWeightRecord: (PersonalRecordItem & { weightKg?: number }) | null = null;

  // Mapa de melhor carga por exercício
  const exerciseBestWeight = new Map<
    string,
    { exerciseName: string; weightKg: number; reps: number; date: string; divisionName?: string }
  >();

  for (const s of validSessions) {
    const sessionDate = s.startTime;
    const d = new Date(sessionDate);
    const displayDate = !isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      : sessionDate;

    // Recorde de Volume na Sessão
    const sessionVol = computeSessionVolumeKg(s);

    if (
      sessionVol > 0 &&
      (!highestVolumeSessionRecord || sessionVol > highestVolumeSessionRecord.numericValue)
    ) {
      highestVolumeSessionRecord = {
        id: `pr_volume_${s.id}`,
        type: 'max_session_volume',
        title: 'Maior Volume em uma Sessão',
        subtitle: `${s.divisionName || 'Treino'} — Volume total realizado`,
        exerciseName: s.divisionName || 'Sessão Completa',
        valueDisplay: `${sessionVol.toLocaleString('pt-BR')} kg`,
        numericValue: sessionVol,
        date: sessionDate,
        displayDate,
        divisionName: s.divisionName,
      };
    }

    // Recorde de Carga e Repetições por exercício
    if (s.exerciseLogs) {
      for (const ex of s.exerciseLogs) {
        if (ex.skipped || !ex.sets) continue;
        for (const st of ex.sets) {
          if (!st.completed) continue;
          const weight = Number(st.actualWeightKg) || 0;
          const reps = Number(st.actualReps) || 0;

          if (weight > 0 && reps > 0) {
            if (
              !highestWeightRecord ||
              weight > highestWeightRecord.numericValue
            ) {
              highestWeightRecord = {
                id: `pr_weight_global_${ex.exerciseId}`,
                type: 'max_weight',
                title: 'Maior Carga Levantada',
                subtitle: `${ex.exerciseName} (${reps} reps)`,
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                valueDisplay: `${weight} kg`,
                numericValue: weight,
                date: sessionDate,
                displayDate,
                divisionName: s.divisionName,
              };
            }

            // Maior repetição com carga relevante
            if (
              !highestRepsWithWeightRecord ||
              reps > highestRepsWithWeightRecord.numericValue ||
              (reps === highestRepsWithWeightRecord.numericValue &&
                weight > (highestRepsWithWeightRecord.weightKg || 0))
            ) {
              highestRepsWithWeightRecord = {
                id: `pr_reps_${ex.exerciseId}`,
                type: 'max_reps_with_weight',
                title: 'Maior Sequência de Repetições com Carga',
                subtitle: `${ex.exerciseName} (${weight} kg)`,
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                valueDisplay: `${reps} reps`,
                numericValue: reps,
                date: sessionDate,
                displayDate,
                divisionName: s.divisionName,
                weightKg: weight,
              };
            }

            // Melhores cargas por exercício
            const currBest = exerciseBestWeight.get(ex.exerciseId);
            if (!currBest || weight > currBest.weightKg) {
              exerciseBestWeight.set(ex.exerciseId, {
                exerciseName: ex.exerciseName,
                weightKg: weight,
                reps,
                date: sessionDate,
                divisionName: s.divisionName,
              });
            }
          }
        }
      }
    }
  }

  if (highestWeightRecord) records.push(highestWeightRecord);
  if (highestVolumeSessionRecord) records.push(highestVolumeSessionRecord);
  if (highestRepsWithWeightRecord) {
    const { weightKg: _unused, ...cleanRepsRecord } = highestRepsWithWeightRecord;
    records.push(cleanRepsRecord);
  }

  // Adiciona PR de maior carga para outros exercícios relevantes
  for (const [exId, best] of exerciseBestWeight.entries()) {
    if (highestWeightRecord && highestWeightRecord.exerciseId === exId) continue;
    const d = new Date(best.date);
    const displayDate = !isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      : best.date;

    records.push({
      id: `pr_ex_${exId}`,
      type: 'max_weight',
      title: `Recorde: ${best.exerciseName}`,
      subtitle: `${best.reps} reps em ${best.divisionName || 'Treino'}`,
      exerciseId: exId,
      exerciseName: best.exerciseName,
      valueDisplay: `${best.weightKg} kg`,
      numericValue: best.weightKg,
      date: best.date,
      displayDate,
      divisionName: best.divisionName,
    });
  }

  return records;
}

/**
 * Compara duas avaliações físicas fornecendo variações absolutas e percentuais.
 */
export function compareBodyAssessments(
  current: BodyMeasurementItem,
  previous: BodyMeasurementItem
): MeasurementComparisonMetric[] {
  const fields: Array<{ key: keyof BodyMeasurementItem; label: string; unit: string }> = [
    { key: 'weightKg', label: 'Peso Corporal', unit: 'kg' },
    { key: 'waistCm', label: 'Cintura', unit: 'cm' },
    { key: 'abdomenCm', label: 'Abdômen', unit: 'cm' },
    { key: 'chestCm', label: 'Peito / Tórax', unit: 'cm' },
    { key: 'armRightCm', label: 'Braço Direito', unit: 'cm' },
    { key: 'armLeftCm', label: 'Braço Esquerdo', unit: 'cm' },
    { key: 'thighRightCm', label: 'Coxa Direita', unit: 'cm' },
    { key: 'thighLeftCm', label: 'Coxa Esquerda', unit: 'cm' },
    { key: 'calfRightCm', label: 'Panturrilha Direita', unit: 'cm' },
    { key: 'calfLeftCm', label: 'Panturrilha Esquerda', unit: 'cm' },
  ];

  const results: MeasurementComparisonMetric[] = [];

  for (const f of fields) {
    const cur = current[f.key];
    const prev = previous[f.key];

    const curNum = typeof cur === 'number' && !isNaN(cur) ? cur : undefined;
    const prevNum = typeof prev === 'number' && !isNaN(prev) ? prev : undefined;

    if (curNum !== undefined || prevNum !== undefined) {
      let delta: number | undefined = undefined;
      let deltaPercent: number | undefined = undefined;

      if (curNum !== undefined && prevNum !== undefined) {
        delta = Number((curNum - prevNum).toFixed(1));
        deltaPercent =
          prevNum > 0 ? Number(((delta / prevNum) * 100).toFixed(1)) : 0;
      }

      results.push({
        key: f.key,
        label: f.label,
        unit: f.unit,
        currentVal: curNum,
        prevVal: prevNum,
        delta,
        deltaPercent,
      });
    }
  }

  return results;
}

/**
 * Gera relatório completo em JSON com histórico de sessões únicas e efetivamente concluídas
 * e avaliações físicas. Aplica internamente normalizeCompletedSessions.
 */
export function exportEvolutionReportJson(
  completedSessions: WorkoutSessionItem[],
  measurements: BodyMeasurementItem[],
  nowMs: number = Date.now()
): string {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);
  const safeMeasurements = Array.isArray(measurements) ? measurements : [];

  const payload = {
    app: 'TREINO CERTO',
    exportType: 'relatorio_evolucao_completo',
    version: '1.1',
    exportedAt: new Date().toISOString(),
    summary: {
      totalCompletedWorkouts: validSessions.length,
      totalAssessments: safeMeasurements.length,
    },
    completedSessions: validSessions.map((s) => ({
      id: s.id,
      workoutPlanId: s.workoutPlanId,
      planName: s.planName,
      divisionName: s.divisionName,
      startTime: s.startTime,
      endTime: s.endTime,
      durationSeconds: s.elapsedActiveSeconds || s.durationSeconds || 0,
      totalVolumeKg: computeSessionVolumeKg(s),
      exercisesCount: s.exercisesCompleted || 0,
      exerciseLogs: s.exerciseLogs || [],
    })),
    bodyMeasurements: safeMeasurements,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Gera relatório tabular em formato CSV para exportação offline e importação em planilhas.
 * Aplica internamente normalizeCompletedSessions para exportar exclusivamente sessões únicas
 * e efetivamente concluídas.
 */
export function exportEvolutionReportCsv(
  completedSessions: WorkoutSessionItem[],
  measurements: BodyMeasurementItem[],
  nowMs: number = Date.now()
): string {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);
  const safeMeasurements = Array.isArray(measurements) ? measurements : [];

  const lines: string[] = [];

  // Cabeçalho da seção de Treinos Concluídos
  lines.push('--- SESSÕES DE TREINO CONCLUÍDAS ---');
  lines.push(`Total_Sessoes_Unicas_Concluidas: ${validSessions.length}`);
  lines.push(
    'Sessao_ID,Data,Ficha,Divisao,Duracao_Minutos,Exercicio,Serie,Carga_Kg,Repeticoes,Volume_Serie_Kg,Volume_Total_Sessao_Kg'
  );

  for (const s of validSessions) {
    const sessionId = `"${s.id.replace(/"/g, '""')}"`;
    const date = s.startTime ? s.startTime.replace('T', ' ').slice(0, 19) : '';
    const plan = `"${(s.planName || 'Ficha').replace(/"/g, '""')}"`;
    const division = `"${(s.divisionName || '').replace(/"/g, '""')}"`;
    const durationMin = Math.round(
      (s.elapsedActiveSeconds || s.durationSeconds || 0) / 60
    );
    const totalSessionVol = computeSessionVolumeKg(s);

    let hasLoggedSets = false;
    if (s.exerciseLogs && s.exerciseLogs.length > 0) {
      for (const ex of s.exerciseLogs) {
        if (ex.skipped || !ex.sets) continue;
        const exName = `"${(ex.exerciseName || ex.exerciseId).replace(/"/g, '""')}"`;
        for (const st of ex.sets) {
          if (!st.completed) continue;
          hasLoggedSets = true;
          const weight = st.actualWeightKg || 0;
          const reps = st.actualReps || 0;
          const setVol = weight * reps;
          lines.push(
            `${sessionId},${date},${plan},${division},${durationMin},${exName},${st.setNumber},${weight},${reps},${setVol},${totalSessionVol}`
          );
        }
      }
    }

    if (!hasLoggedSets) {
      lines.push(
        `${sessionId},${date},${plan},${division},${durationMin},"Sessão sem log detalhado",0,0,0,0,${totalSessionVol}`
      );
    }
  }

  lines.push('');
  lines.push('--- HISTÓRICO DE MEDIDAS CORPORAIS ---');
  lines.push(
    'Data,Peso_Kg,Cintura_Cm,Abdomen_Cm,Peito_Cm,Braco_D_Cm,Braco_E_Cm,Coxa_D_Cm,Coxa_E_Cm,Panturrilha_D_Cm,Panturrilha_E_Cm,Observacoes'
  );

  for (const m of safeMeasurements) {
    const obs = m.notes ? `"${m.notes.replace(/"/g, '""')}"` : '""';
    lines.push(
      `${m.date},${m.weightKg ?? ''},${m.waistCm ?? ''},${m.abdomenCm ?? ''},${m.chestCm ?? ''},${
        m.armRightCm ?? ''
      },${m.armLeftCm ?? ''},${m.thighRightCm ?? ''},${m.thighLeftCm ?? ''},${
        m.calfRightCm ?? ''
      },${m.calfLeftCm ?? ''},${obs}`
    );
  }

  return lines.join('\n');
}
