import { WorkoutSessionItem } from '../types';

const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

/** Gera CSV detalhado sem alterar nem regravar o histórico local. */
export function buildWorkoutHistoryCsv(sessions: WorkoutSessionItem[]): string {
  const headers = [
    'Data', 'Hora', 'Ficha', 'Divisão', 'Exercício', 'Série', 'Tipo de série',
    'Concluída', 'Repetições', 'Carga (kg)', 'Volume da série (kg)', 'RPE', 'RIR', 'Observações da sessão', 'Observações do exercício',
  ];
  const rows: string[][] = [headers];

  for (const session of sessions) {
    const startedAt = new Date(session.startTime);
    const date = Number.isNaN(startedAt.getTime()) ? session.startTime : startedAt.toLocaleDateString('pt-BR');
    const time = Number.isNaN(startedAt.getTime()) ? '' : startedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const base = [date, time, session.planName || 'Ficha', session.divisionName || '', '', '', '', '', '', '', '', '', '', session.notes || '', ''];
    const exercises = session.exerciseLogs || [];

    if (!exercises.length) {
      rows.push(base);
      continue;
    }

    for (const exercise of exercises) {
      if (!exercise.sets?.length) {
        const row = [...base];
        row[4] = exercise.exerciseName;
        row[14] = exercise.notes || '';
        rows.push(row);
        continue;
      }
      for (const set of exercise.sets) {
        const row = [...base];
        row[4] = exercise.exerciseName;
        row[5] = String(set.setNumber);
        row[6] = set.setType || 'working';
        row[7] = set.completed ? 'Sim' : 'Não';
        row[8] = String(set.actualReps ?? 0);
        row[9] = String(set.actualWeightKg ?? 0);
        row[10] = String((set.actualReps || 0) * (set.actualWeightKg || 0));
        row[11] = set.effortRpe === undefined ? '' : String(set.effortRpe);
        row[12] = set.effortRir === undefined ? '' : String(set.effortRir);
        row[14] = exercise.notes || '';
        rows.push(row);
      }
    }
  }

  return `\uFEFF${rows.map(row => row.map(csvCell).join(';')).join('\r\n')}`;
}
