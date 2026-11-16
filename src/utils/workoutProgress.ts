import { WorkoutSessionItem, WorkoutSessionSetLog } from '../types';

export interface ExerciseProgressPoint {
  sessionId: string;
  date: string;
  label: string;
  maxWeightKg: number;
  estimatedOneRepMaxKg: number;
  bestSetVolumeKg: number;
  reps: number;
}

export interface ExercisePersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  estimatedOneRepMaxKg: number;
  bestSetVolumeKg: number;
  achievedAt: string;
  sessionId: string;
  reps: number;
}

const isValidSet = (set: WorkoutSessionSetLog): boolean =>
  set.completed && Number.isFinite(set.actualWeightKg) && set.actualWeightKg >= 0 &&
  Number.isFinite(set.actualReps) && set.actualReps > 0;

// Epley: aplicado somente a séries de até 12 repetições; não estima cargas máximas
// a partir de séries longas, aquecimento ou séries incompletas.
export const estimateOneRepMax = (weightKg: number, reps: number): number =>
  weightKg > 0 && reps > 0 && reps <= 12 ? weightKg * (1 + reps / 30) : 0;

export function buildExerciseProgress(sessions: WorkoutSessionItem[]): Map<string, ExerciseProgressPoint[]> {
  const result = new Map<string, ExerciseProgressPoint[]>();
  const ordered = [...sessions].filter(s => s.isCompleted).sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  for (const session of ordered) {
    for (const exercise of session.exerciseLogs || []) {
      if (exercise.skipped) continue;
      const sets = (exercise.sets || []).filter(isValidSet).filter(s => s.setType !== 'warmup');
      if (!sets.length) continue;
      const best = [...sets].sort((a, b) =>
        estimateOneRepMax(b.actualWeightKg, b.actualReps) - estimateOneRepMax(a.actualWeightKg, a.actualReps) ||
        (b.actualWeightKg * b.actualReps) - (a.actualWeightKg * a.actualReps))[0];
      const point: ExerciseProgressPoint = {
        sessionId: session.id,
        date: session.startTime,
        label: new Date(session.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        maxWeightKg: Math.max(...sets.map(s => s.actualWeightKg)),
        estimatedOneRepMaxKg: estimateOneRepMax(best.actualWeightKg, best.actualReps),
        bestSetVolumeKg: best.actualWeightKg * best.actualReps,
        reps: best.actualReps,
      };
      const points = result.get(exercise.exerciseId) || [];
      points.push(point);
      result.set(exercise.exerciseId, points);
    }
  }
  return result;
}

export function buildPersonalRecords(sessions: WorkoutSessionItem[]): ExercisePersonalRecord[] {
  const progress = buildExerciseProgress(sessions);
  const names = new Map<string, string>();
  sessions.forEach(session => (session.exerciseLogs || []).forEach(ex => names.set(ex.exerciseId, ex.exerciseName)));
  const records: ExercisePersonalRecord[] = [];
  progress.forEach((points, exerciseId) => {
    const candidates = points.filter(p => p.maxWeightKg > 0 || p.estimatedOneRepMaxKg > 0);
    if (!candidates.length) return;
    const best = [...candidates].sort((a, b) =>
      b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg || b.maxWeightKg - a.maxWeightKg)[0];
    records.push({ exerciseId, exerciseName: names.get(exerciseId) || exerciseId,
      maxWeightKg: Math.max(...points.map(p => p.maxWeightKg)),
      estimatedOneRepMaxKg: best.estimatedOneRepMaxKg,
      bestSetVolumeKg: Math.max(...points.map(p => p.bestSetVolumeKg)),
      achievedAt: best.date, sessionId: best.sessionId, reps: best.reps });
  });
  return records.sort((a, b) => b.estimatedOneRepMaxKg - a.estimatedOneRepMaxKg || b.maxWeightKg - a.maxWeightKg);
}
