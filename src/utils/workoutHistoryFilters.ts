import { WorkoutSessionItem } from '../types';

export type WorkoutHistoryPeriod = 'all' | '7' | '30' | '90';
export type WorkoutHistorySort = 'newest' | 'oldest' | 'volume' | 'duration';

export interface WorkoutHistoryFilters {
  search?: string;
  period?: WorkoutHistoryPeriod;
  sort?: WorkoutHistorySort;
}

/** Filtra e ordena uma cópia do histórico; nunca modifica a lista persistida. */
export function filterWorkoutHistory(
  sessions: WorkoutSessionItem[],
  filters: WorkoutHistoryFilters = {},
  now = Date.now(),
): WorkoutSessionItem[] {
  const query = (filters.search || '').trim().toLocaleLowerCase('pt-BR');
  const period = filters.period || 'all';
  const sort = filters.sort || 'newest';
  const cutoff = period === 'all' ? null : now - Number(period) * 24 * 60 * 60 * 1000;

  return sessions
    .filter(session => {
      const timestamp = new Date(session.startTime).getTime();
      if (cutoff !== null && (!Number.isFinite(timestamp) || timestamp < cutoff)) return false;
      if (!query) return true;
      const searchable = [session.planName, session.divisionName, ...(session.exerciseLogs || []).map(exercise => exercise.exerciseName)]
        .filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
      return searchable.includes(query);
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (sort === 'volume') return (b.totalVolumeKg || 0) - (a.totalVolumeKg || 0);
      if (sort === 'duration') return (b.durationSeconds || 0) - (a.durationSeconds || 0);
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
}
