/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LocalReminderConfig,
  WeeklySummaryMetrics,
  WorkoutGoalConfig,
  WorkoutSessionItem,
} from '../types';
import { normalizeCompletedSessions } from './evolutionCalculator';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface GoalComplianceWeek {
  weekKey: string;
  weekLabel: string;
  completedWorkouts: number;
  targetWorkouts: number;
  compliancePercentage: number;
  isGoalMet: boolean;
}

export interface GoalComplianceMonth {
  monthKey: string;
  monthLabel: string;
  completedWorkouts: number;
  targetWorkouts: number;
  compliancePercentage: number;
}

export interface GoalProgressSummary {
  targetWorkoutsPerWeek: number;
  preferredDays: number[];
  startDate?: string;
  isActive: boolean;
  currentWeekCompleted: number;
  currentWeekCompliancePercent: number;
  isCurrentWeekGoalMet: boolean;
  weeklyHistory: GoalComplianceWeek[];
  monthlyHistory: GoalComplianceMonth[];
}

/**
 * Retorna os limites timestamp de início (segunda 00:00:00) e fim (domingo 23:59:59.999) de uma semana contendo d.
 */
function getWeekRange(d: Date): { mondayMs: number; sundayMs: number; mondayDate: Date } {
  const dayOfWeek = (d.getDay() + 6) % 7; // Seg = 0, Dom = 6
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    mondayMs: monday.getTime(),
    sundayMs: sunday.getTime(),
    mondayDate: monday,
  };
}

/**
 * Calcula o progresso e o histórico de cumprimento da meta semanal e evolução mensal.
 */
export function calculateGoalProgress(
  completedSessions: WorkoutSessionItem[],
  goalConfig?: WorkoutGoalConfig,
  defaultWeeklyTarget: number = 3,
  nowMs: number = Date.now()
): GoalProgressSummary {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);

  const isActive = goalConfig?.isActive !== false; // Padrão true se configurado
  const targetPerWeek =
    isActive && goalConfig?.targetWorkoutsPerWeek && goalConfig.targetWorkoutsPerWeek > 0
      ? goalConfig.targetWorkoutsPerWeek
      : defaultWeeklyTarget > 0
      ? defaultWeeklyTarget
      : 3;

  const preferredDays = goalConfig?.preferredDays || [];
  const startDate = goalConfig?.startDate;

  const currDate = new Date(nowMs);
  const { mondayMs, sundayMs } = getWeekRange(currDate);

  // Sessões da semana corrente (segunda a domingo)
  const currentWeekSessions = validSessions.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t >= mondayMs && t <= sundayMs;
  });

  const currentWeekCompleted = currentWeekSessions.length;
  const currentWeekCompliancePercent = Math.min(
    100,
    Math.round((currentWeekCompleted / targetPerWeek) * 100)
  );
  const isCurrentWeekGoalMet = currentWeekCompleted >= targetPerWeek;

  // Histórico de semanas (últimas 8 semanas)
  const weeklyHistory: GoalComplianceWeek[] = [];
  for (let i = 0; i < 8; i++) {
    const refDate = new Date(nowMs - i * 7 * MS_PER_DAY);
    const range = getWeekRange(refDate);

    const weekSessions = validSessions.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= range.mondayMs && t <= range.sundayMs;
    });

    const count = weekSessions.length;
    const compPercent = Math.min(100, Math.round((count / targetPerWeek) * 100));

    const dayStartStr = `${String(range.mondayDate.getDate()).padStart(2, '0')}/${String(
      range.mondayDate.getMonth() + 1
    ).padStart(2, '0')}`;

    weeklyHistory.push({
      weekKey: `${range.mondayDate.getFullYear()}-W${i}`,
      weekLabel: i === 0 ? 'Semana Atual' : `Sem. de ${dayStartStr}`,
      completedWorkouts: count,
      targetWorkouts: targetPerWeek,
      compliancePercentage: compPercent,
      isGoalMet: count >= targetPerWeek,
    });
  }

  // Histórico mensal (últimos 6 meses)
  const monthlyHistory: GoalComplianceMonth[] = [];
  const currYear = currDate.getFullYear();
  const currMonth = currDate.getMonth();

  for (let m = 0; m < 6; m++) {
    const monthDate = new Date(currYear, currMonth - m, 1);
    const mYear = monthDate.getFullYear();
    const mMonth = monthDate.getMonth();

    const monthStartMs = new Date(mYear, mMonth, 1, 0, 0, 0, 0).getTime();
    const monthEndMs = new Date(mYear, mMonth + 1, 0, 23, 59, 59, 999).getTime();

    const mSessions = validSessions.filter((s) => {
      const t = new Date(s.startTime).getTime();
      return t >= monthStartMs && t <= monthEndMs;
    });

    // Número aproximado de semanas no mês
    const daysInM = new Date(mYear, mMonth + 1, 0).getDate();
    const weeksInM = daysInM / 7;
    const monthlyTarget = Math.round(targetPerWeek * weeksInM);

    const count = mSessions.length;
    const compPercent =
      monthlyTarget > 0 ? Math.min(100, Math.round((count / monthlyTarget) * 100)) : 0;

    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(monthDate);
    const monthLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}/${String(
      mYear
    ).slice(2)}`;

    monthlyHistory.push({
      monthKey: `${mYear}-${String(mMonth + 1).padStart(2, '0')}`,
      monthLabel,
      completedWorkouts: count,
      targetWorkouts: monthlyTarget,
      compliancePercentage: compPercent,
    });
  }

  return {
    targetWorkoutsPerWeek: targetPerWeek,
    preferredDays,
    startDate,
    isActive,
    currentWeekCompleted,
    currentWeekCompliancePercent,
    isCurrentWeekGoalMet,
    weeklyHistory,
    monthlyHistory,
  };
}

/**
 * Calcula o resumo semanal automático (BLOCO 4).
 * Garante 100% de consistência com os cálculos do CP05 (volume, duração e desduplicação).
 */
export function calculateWeeklySummary(
  completedSessions: WorkoutSessionItem[],
  goalConfig?: WorkoutGoalConfig,
  defaultWeeklyTarget: number = 3,
  nowMs: number = Date.now()
): WeeklySummaryMetrics {
  const validSessions = normalizeCompletedSessions(completedSessions, nowMs);

  const currDate = new Date(nowMs);
  const currentWeekRange = getWeekRange(currDate);

  // Semana anterior (7 dias antes)
  const prevWeekRefDate = new Date(nowMs - 7 * MS_PER_DAY);
  const prevWeekRange = getWeekRange(prevWeekRefDate);

  // Sessões da semana atual
  const currentWeekSessions = validSessions.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t >= currentWeekRange.mondayMs && t <= currentWeekRange.sundayMs;
  });

  // Sessões da semana anterior
  const prevWeekSessions = validSessions.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t >= prevWeekRange.mondayMs && t <= prevWeekRange.sundayMs;
  });

  const isActiveGoal = goalConfig?.isActive !== false;
  const targetWorkouts =
    isActiveGoal && goalConfig?.targetWorkoutsPerWeek && goalConfig.targetWorkoutsPerWeek > 0
      ? goalConfig.targetWorkoutsPerWeek
      : defaultWeeklyTarget > 0
      ? defaultWeeklyTarget
      : 3;

  const completedWorkouts = currentWeekSessions.length;
  const compliancePercentage = Math.min(
    100,
    Math.round((completedWorkouts / targetWorkouts) * 100)
  );

  let activeDurationSeconds = 0;
  let totalVolumeKg = 0;
  let topVolumeSession: { name: string; volumeKg: number } | null = null;

  for (const s of currentWeekSessions) {
    const dur = s.elapsedActiveSeconds || s.durationSeconds || 0;
    activeDurationSeconds += dur;

    let sVol = 0;
    if (s.exerciseLogs && Array.isArray(s.exerciseLogs)) {
      for (const ex of s.exerciseLogs) {
        if (ex.skipped || !ex.sets) continue;
        for (const st of ex.sets) {
          if (st.completed && st.actualWeightKg > 0 && st.actualReps > 0) {
            sVol += st.actualWeightKg * st.actualReps;
          }
        }
      }
    } else {
      sVol = s.totalVolumeKg || 0;
    }

    totalVolumeKg += sVol;

    if (!topVolumeSession || sVol > topVolumeSession.volumeKg) {
      topVolumeSession = {
        name: s.divisionName || 'Treino',
        volumeKg: sVol,
      };
    }
  }

  // Métricas da semana anterior
  const previousWeekCompletedWorkouts = prevWeekSessions.length;
  let previousWeekVolumeKg = 0;
  let previousWeekDurationSeconds = 0;

  for (const s of prevWeekSessions) {
    previousWeekDurationSeconds += s.elapsedActiveSeconds || s.durationSeconds || 0;

    let sVol = 0;
    if (s.exerciseLogs && Array.isArray(s.exerciseLogs)) {
      for (const ex of s.exerciseLogs) {
        if (ex.skipped || !ex.sets) continue;
        for (const st of ex.sets) {
          if (st.completed && st.actualWeightKg > 0 && st.actualReps > 0) {
            sVol += st.actualWeightKg * st.actualReps;
          }
        }
      }
    } else {
      sVol = s.totalVolumeKg || 0;
    }
    previousWeekVolumeKg += sVol;
  }

  const workoutsDelta = completedWorkouts - previousWeekCompletedWorkouts;
  const volumeDeltaKg = totalVolumeKg - previousWeekVolumeKg;
  const volumeDeltaPercent =
    previousWeekVolumeKg > 0
      ? Number(((volumeDeltaKg / previousWeekVolumeKg) * 100).toFixed(1))
      : totalVolumeKg > 0
      ? 100
      : 0;
  const durationDeltaSeconds = activeDurationSeconds - previousWeekDurationSeconds;

  // Destaques automáticos sem prescrições médicas
  const highlights: string[] = [];

  if (completedWorkouts >= targetWorkouts && completedWorkouts > 0) {
    highlights.push(`Meta semanal 100% atingida! (${completedWorkouts} de ${targetWorkouts} treinos)`);
  } else if (completedWorkouts > 0) {
    const remaining = targetWorkouts - completedWorkouts;
    highlights.push(
      `Falta${remaining > 1 ? 'm' : ''} ${remaining} treino${
        remaining > 1 ? 's' : ''
      } para atingir a meta semanal (${completedWorkouts}/${targetWorkouts}).`
    );
  } else {
    highlights.push('Nenhum treino realizado ainda nesta semana.');
  }

  if (workoutsDelta > 0) {
    highlights.push(
      `Evolução de frequência: +${workoutsDelta} treino${
        workoutsDelta > 1 ? 's' : ''
      } que na semana anterior.`
    );
  }

  if (topVolumeSession && topVolumeSession.volumeKg > 0) {
    highlights.push(
      `Destaque de carga: ${topVolumeSession.name} com ${topVolumeSession.volumeKg.toLocaleString(
        'pt-BR'
      )} kg movimentados.`
    );
  }

  const startD = new Date(currentWeekRange.mondayMs);
  const endD = new Date(currentWeekRange.sundayMs);

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

  return {
    weekStartDate: formatDate(startD),
    weekEndDate: formatDate(endD),
    completedWorkouts,
    targetWorkouts,
    compliancePercentage,
    activeDurationSeconds,
    totalVolumeKg,
    previousWeekCompletedWorkouts,
    previousWeekVolumeKg,
    previousWeekDurationSeconds,
    workoutsDelta,
    volumeDeltaKg,
    volumeDeltaPercent,
    durationDeltaSeconds,
    highlights,
  };
}

/**
 * Verifica se um lembrete local deve ser exibido na interface do app (BLOCO 2).
 * Previne duplicatas no mesmo dia comparando com lastShownDate.
 */
export function checkLocalReminderTrigger(
  reminderConfig?: LocalReminderConfig,
  nowMs: number = Date.now()
): { shouldTrigger: boolean; currentDate: string; message: string } | null {
  if (!reminderConfig || reminderConfig.isActive !== true) {
    return null;
  }

  const now = new Date(nowMs);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const currentDate = `${year}-${month}-${day}`;

  // Se já foi exibido hoje, previne duplicação
  if (reminderConfig.lastShownDate === currentDate) {
    return null;
  }

  const currentDayOfWeek = now.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
  const daysList = Array.isArray(reminderConfig.days) ? reminderConfig.days : [];

  if (!daysList.includes(currentDayOfWeek)) {
    return null;
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;

  const targetTime = reminderConfig.time || '08:00';

  if (currentTime >= targetTime) {
    const msg =
      reminderConfig.message && reminderConfig.message.trim().length > 0
        ? reminderConfig.message.trim()
        : 'Hora do seu treino! Que tal manter a regularidade hoje?';

    return {
      shouldTrigger: true,
      currentDate,
      message: msg,
    };
  }

  return null;
}
