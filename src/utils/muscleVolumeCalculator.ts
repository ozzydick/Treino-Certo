import { ExerciseItem, MuscleGroupId, MUSCLE_GROUP_LABELS, WorkoutSessionItem } from '../types';
import { DEFAULT_EXERCISES_CATALOG } from '../constants/exercisesCatalog';
import { normalizeCompletedSessions } from './evolutionCalculator';

export interface MuscleVolumeRow {
  muscleGroup: MuscleGroupId;
  label: string;
  effectiveSets: number;
  primarySets: number;
  secondarySets: number;
  sessions: number;
  frequencyPerWeek: number;
}
export interface WeeklyMuscleVolume {
  weekStart: string;
  label: string;
  totalEffectiveSets: number;
  byMuscle: Partial<Record<MuscleGroupId, number>>;
}
export interface MuscleVolumeReport {
  rows: MuscleVolumeRow[];
  weeks: WeeklyMuscleVolume[];
  totalEffectiveSets: number;
  trainingSessions: number;
  periodWeeks: number;
}

const GROUPS = Object.keys(MUSCLE_GROUP_LABELS) as MuscleGroupId[];
const SECONDARY_FACTOR = 0.5;
const mondayStart = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
};
const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/** Volume is based on completed working/drop/failure sets; warm-ups are excluded.
 * Primary muscle = 1.0 set; each secondary muscle = 0.5 set (transparent estimate).
 */
export function calculateMuscleVolume(
  sessions: WorkoutSessionItem[],
  nowMs = Date.now(),
  weeksCount = 8,
  additionalExercises: ExerciseItem[] = [],
): MuscleVolumeReport {
  const valid = normalizeCompletedSessions(sessions, nowMs);
  // Exercícios personalizados com grupo muscular definido também participam da análise.
  // IDs personalizados não substituem nem sobrescrevem o catálogo oficial.
  const catalog = new Map([...DEFAULT_EXERCISES_CATALOG, ...additionalExercises].map(e => [e.id, e]));
  const totals = new Map<MuscleGroupId, { primary: number; secondary: number; sessions: Set<string> }>();
  GROUPS.forEach(g => totals.set(g, { primary: 0, secondary: 0, sessions: new Set() }));
  const weekly = new Map<string, WeeklyMuscleVolume>();
  const currentMonday = mondayStart(new Date(nowMs));
  for (let i = weeksCount - 1; i >= 0; i--) {
    const d = new Date(currentMonday); d.setDate(d.getDate() - i * 7);
    const key = dateKey(d);
    weekly.set(key, { weekStart: key, label: `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`, totalEffectiveSets: 0, byMuscle: {} });
  }
  const weekSessionSets = new Map<string, Set<string>>();
  for (const session of valid) {
    const d = new Date(session.startTime);
    const wk = dateKey(mondayStart(d));
    const week = weekly.get(wk);
    if (!week || !Array.isArray(session.exerciseLogs)) continue;
    for (const log of session.exerciseLogs) {
      if (log.skipped) continue;
      const exercise = catalog.get(log.exerciseId);
      if (!exercise) continue;
      const effective = (log.sets || []).filter(s => s.completed && s.actualReps > 0 && (s.setType || 'working') !== 'warmup');
      if (!effective.length) continue;
      const primary = exercise.primaryMuscleGroup;
      const secondary = [...new Set(exercise.secondaryMuscleGroups || [])].filter(g => g !== primary);
      const primaryCount = effective.length;
      const primaryTotal = totals.get(primary);
      if (primaryTotal) { primaryTotal.primary += primaryCount; primaryTotal.sessions.add(session.id); }
      week.byMuscle[primary] = (week.byMuscle[primary] || 0) + primaryCount;
      week.totalEffectiveSets += primaryCount;
      for (const group of secondary) {
        const contribution = primaryCount * SECONDARY_FACTOR;
        const item = totals.get(group);
        if (item) { item.secondary += contribution; item.sessions.add(session.id); }
        week.byMuscle[group] = (week.byMuscle[group] || 0) + contribution;
        week.totalEffectiveSets += contribution;
      }
      const sessionKey = `${session.id}:${primary}`;
      const set = weekSessionSets.get(sessionKey) || new Set<string>(); set.add(primary); weekSessionSets.set(sessionKey, set);
    }
  }
  const rows = GROUPS.map(group => {
    const item = totals.get(group)!;
    const effectiveSets = item.primary + item.secondary;
    return { muscleGroup: group, label: MUSCLE_GROUP_LABELS[group], effectiveSets, primarySets: item.primary, secondarySets: item.secondary, sessions: item.sessions.size, frequencyPerWeek: Number((item.sessions.size / weeksCount).toFixed(1)) };
  }).sort((a,b) => b.effectiveSets - a.effectiveSets);
  const weeks = [...weekly.values()];
  const totalEffectiveSets = rows.reduce((sum, r) => sum + r.effectiveSets, 0);
  const trainingSessions = new Set(valid.filter(s => s.exerciseLogs?.some(e => !e.skipped && e.sets?.some(st => st.completed && st.actualReps > 0 && (st.setType || 'working') !== 'warmup'))).map(s => s.id)).size;
  return { rows, weeks, totalEffectiveSets, trainingSessions, periodWeeks: weeksCount };
}
