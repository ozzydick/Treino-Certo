import { MuscleGroupId, MUSCLE_GROUP_LABELS, WorkoutSessionItem } from '../types';
import { normalizeCompletedSessions } from './evolutionCalculator';

export interface WeeklyPerformancePoint {
  weekStart: string;
  label: string;
  sessions: number;
  volumeKg: number;
  completedSets: number;
  activeMinutes: number;
}

export interface ExercisePerformancePoint {
  exerciseId: string;
  exerciseName: string;
  sessions: number;
  completedSets: number;
  volumeKg: number;
  maxWeightKg: number;
  lastPerformedAt: string;
}

export interface WorkoutPerformanceInsights {
  weeks: WeeklyPerformancePoint[];
  completedSessions: number;
  completedSets: number;
  totalVolumeKg: number;
  totalActiveMinutes: number;
  activeWeeks: number;
  consistencyPercent: number;
  averageSessionsPerActiveWeek: number;
  averageVolumePerSessionKg: number;
  bestWeek: WeeklyPerformancePoint | null;
  recentFourWeekVolumeKg: number;
  previousFourWeekVolumeKg: number;
  volumeChangePercent: number | null;
  recentFourWeekSessions: number;
  previousFourWeekSessions: number;
  sessionsChangePercent: number | null;
  exerciseHighlights: ExercisePerformancePoint[];
}

const toDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const getWeekStart = (value: Date) => {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  date.setHours(0, 0, 0, 0);
  return date;
};

function getSessionVolume(session: WorkoutSessionItem): number {
  if (Array.isArray(session.exerciseLogs)) {
    return session.exerciseLogs.reduce((sessionTotal, exercise) => {
      if (exercise.skipped || !Array.isArray(exercise.sets)) return sessionTotal;
      return sessionTotal + exercise.sets.reduce((exerciseTotal, set) => {
        if (!set.completed) return exerciseTotal;
        const weight = Number(set.actualWeightKg) || 0;
        const reps = Number(set.actualReps) || 0;
        return exerciseTotal + (weight > 0 && reps > 0 ? weight * reps : 0);
      }, 0);
    }, 0);
  }
  return Number.isFinite(session.totalVolumeKg) ? Math.max(0, session.totalVolumeKg || 0) : 0;
}

/** Eight Monday-to-Sunday buckets, with the current week shown as an in-progress period. */
export function buildWorkoutPerformanceInsights(
  sessions: WorkoutSessionItem[],
  now = new Date(),
): WorkoutPerformanceInsights {
  const validSessions = normalizeCompletedSessions(sessions, now.getTime());
  const currentWeek = getWeekStart(now);
  const starts: Date[] = [];
  for (let offset = 7; offset >= 0; offset -= 1) {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - offset * 7);
    starts.push(start);
  }

  const buckets = new Map(starts.map((start) => [toDateKey(start), {
    weekStart: toDateKey(start),
    label: start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    sessions: 0,
    volumeKg: 0,
    completedSets: 0,
    activeMinutes: 0,
  }]));
  const exerciseMap = new Map<string, ExercisePerformancePoint>();

  for (const session of validSessions) {
    const date = new Date(session.startTime);
    const bucket = buckets.get(toDateKey(getWeekStart(date)));
    if (!bucket) continue;
    bucket.sessions += 1;
    bucket.volumeKg += getSessionVolume(session);
    bucket.activeMinutes += Math.max(0, session.elapsedActiveSeconds || session.durationSeconds || 0) / 60;

    for (const exercise of session.exerciseLogs || []) {
      if (exercise.skipped) continue;
      const effectiveSets = (exercise.sets || []).filter((set) =>
        set.completed && set.actualReps > 0 && (set.setType || 'working') !== 'warmup'
      );
      if (!effectiveSets.length) continue;
      bucket.completedSets += effectiveSets.length;

      const current = exerciseMap.get(exercise.exerciseId) || {
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName || exercise.exerciseId,
        sessions: 0,
        completedSets: 0,
        volumeKg: 0,
        maxWeightKg: 0,
        lastPerformedAt: session.startTime,
      };
      current.sessions += 1;
      current.completedSets += effectiveSets.length;
      current.volumeKg += effectiveSets.reduce((sum, set) => sum + Math.max(0, set.actualWeightKg || 0) * Math.max(0, set.actualReps || 0), 0);
      current.maxWeightKg = Math.max(current.maxWeightKg, ...effectiveSets.map((set) => Number(set.actualWeightKg) || 0));
      if (new Date(session.startTime).getTime() > new Date(current.lastPerformedAt).getTime()) {
        current.lastPerformedAt = session.startTime;
      }
      exerciseMap.set(exercise.exerciseId, current);
    }
  }

  const weeks = [...buckets.values()];
  const recentWeeks = weeks.slice(4);
  const previousWeeks = weeks.slice(0, 4);
  const sum = (items: WeeklyPerformancePoint[], key: 'sessions' | 'volumeKg') =>
    items.reduce((total, item) => total + item[key], 0);
  const recentFourWeekVolumeKg = sum(recentWeeks, 'volumeKg');
  const previousFourWeekVolumeKg = sum(previousWeeks, 'volumeKg');
  const recentFourWeekSessions = sum(recentWeeks, 'sessions');
  const previousFourWeekSessions = sum(previousWeeks, 'sessions');
  const activeWeeks = weeks.filter((week) => week.sessions > 0).length;
  const completedSessions = weeks.reduce((total, week) => total + week.sessions, 0);
  const totalVolumeKg = weeks.reduce((total, week) => total + week.volumeKg, 0);
  const completedSets = weeks.reduce((total, week) => total + week.completedSets, 0);
  const totalActiveMinutes = weeks.reduce((total, week) => total + week.activeMinutes, 0);
  const bestWeek = [...weeks].filter((week) => week.sessions > 0)
    .sort((a, b) => b.volumeKg - a.volumeKg || b.sessions - a.sessions)[0] || null;
  const exerciseHighlights = [...exerciseMap.values()]
    .sort((a, b) => b.volumeKg - a.volumeKg || b.completedSets - a.completedSets)
    .slice(0, 8);

  return {
    weeks,
    completedSessions,
    completedSets,
    totalVolumeKg,
    totalActiveMinutes,
    activeWeeks,
    consistencyPercent: Math.round((activeWeeks / weeks.length) * 100),
    averageSessionsPerActiveWeek: activeWeeks ? Number((completedSessions / activeWeeks).toFixed(1)) : 0,
    averageVolumePerSessionKg: completedSessions ? Number((totalVolumeKg / completedSessions).toFixed(1)) : 0,
    bestWeek,
    recentFourWeekVolumeKg,
    previousFourWeekVolumeKg,
    volumeChangePercent: previousFourWeekVolumeKg > 0
      ? Number((((recentFourWeekVolumeKg - previousFourWeekVolumeKg) / previousFourWeekVolumeKg) * 100).toFixed(1))
      : null,
    recentFourWeekSessions,
    previousFourWeekSessions,
    sessionsChangePercent: previousFourWeekSessions > 0
      ? Number((((recentFourWeekSessions - previousFourWeekSessions) / previousFourWeekSessions) * 100).toFixed(1))
      : null,
    exerciseHighlights,
  };
}

export interface PerformanceMuscleRow {
  muscleGroup: MuscleGroupId;
  effectiveSets: number;
  primarySets: number;
  secondarySets: number;
  sessions: number;
}

export function exportWorkoutPerformanceJson(
  insights: WorkoutPerformanceInsights,
  muscleRows: PerformanceMuscleRow[],
): string {
  return JSON.stringify({
    app: 'TREINO CERTO',
    exportType: 'relatorio_analitico_desempenho',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    methodology: {
      period: '8 semanas, de segunda-feira até a semana atual; a semana atual pode estar incompleta',
      sessions: 'somente sessões concluídas, únicas, válidas e não futuras',
      effectiveSets: 'séries concluídas com repetições; aquecimentos excluídos',
      muscleVolume: 'músculo principal = 1,0; músculo secundário = 0,5',
      volume: 'carga real x repetições em todas as séries concluídas, inclusive aquecimentos',
      exerciseHighlights: 'ranking e maior carga calculados apenas com séries efetivas; aquecimentos excluídos',
    },
    summary: {
      completedSessions: insights.completedSessions,
      completedSets: insights.completedSets,
      totalVolumeKg: Number(insights.totalVolumeKg.toFixed(2)),
      totalActiveMinutes: Number(insights.totalActiveMinutes.toFixed(1)),
      consistencyPercent: insights.consistencyPercent,
      averageSessionsPerActiveWeek: insights.averageSessionsPerActiveWeek,
      averageVolumePerSessionKg: insights.averageVolumePerSessionKg,
      volumeChangePercent: insights.volumeChangePercent,
      sessionsChangePercent: insights.sessionsChangePercent,
    },
    weeklyEvolution: insights.weeks,
    muscleGroups: muscleRows.map((row) => ({
      ...row,
      label: MUSCLE_GROUP_LABELS[row.muscleGroup],
    })),
    exerciseHighlights: insights.exerciseHighlights,
  }, null, 2);
}

export function exportWorkoutPerformanceCsv(
  insights: WorkoutPerformanceInsights,
  muscleRows: PerformanceMuscleRow[],
): string {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    'RELATORIO ANALITICO DE DESEMPENHO - TREINO CERTO',
    `Gerado em;${quote(new Date().toLocaleString('pt-BR'))}`,
    '',
    'RESUMO;VALOR',
    `Treinos concluidos;${insights.completedSessions}`,
    `Series efetivas;${insights.completedSets}`,
    `Volume total (kg, inclui aquecimentos concluidos);${insights.totalVolumeKg.toFixed(2)}`,
    `Tempo ativo (min);${insights.totalActiveMinutes.toFixed(1)}`,
    `Consistencia (8 semanas);${insights.consistencyPercent}%`,
    `Variacao de volume (4 semanas vs 4 anteriores);${insights.volumeChangePercent === null ? 'Sem base anterior' : `${insights.volumeChangePercent}%`}`,
    '',
    'EVOLUCAO SEMANAL',
    'Semana;Treinos;Series efetivas;Volume (kg);Tempo ativo (min)',
    ...insights.weeks.map((week) => [week.label, week.sessions, week.completedSets, week.volumeKg.toFixed(2), week.activeMinutes.toFixed(1)].join(';')),
    '',
    'EVOLUCAO POR GRUPO MUSCULAR',
    'Grupo muscular;Series ponderadas;Series principais;Series secundarias;Sessoes',
    ...muscleRows.map((row) => [quote(MUSCLE_GROUP_LABELS[row.muscleGroup]), row.effectiveSets, row.primarySets, row.secondarySets, row.sessions].join(';')),
    '',
    'EXERCICIOS EM DESTAQUE',
    'Exercicio;Sessoes;Series efetivas;Volume (kg);Maior carga (kg);Ultima execucao',
    ...insights.exerciseHighlights.map((item) => [quote(item.exerciseName), item.sessions, item.completedSets, item.volumeKg.toFixed(2), item.maxWeightKg, quote(item.lastPerformedAt)].join(';')),
  ];
  return `\uFEFF${lines.join('\n')}`;
}
