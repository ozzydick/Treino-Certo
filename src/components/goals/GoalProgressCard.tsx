/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Target, Calendar, CheckCircle2, Flame, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateGoalProgress } from '../../utils/goalAndSummaryCalculator';

interface Props {
  onOpenSettings: () => void;
}

const WEEK_DAY_LABELS: Record<number, string> = {
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
  0: 'Dom',
};

export const GoalProgressCard: React.FC<Props> = ({ onOpenSettings }) => {
  const { themeConfig } = useTheme();
  const { preferences, profile } = useUser();
  const { sessionsHistory } = useWorkout();

  const goalSummary = useMemo(() => {
    return calculateGoalProgress(
      sessionsHistory,
      preferences.goalConfig,
      profile.weeklyFrequency || 3
    );
  }, [sessionsHistory, preferences.goalConfig, profile.weeklyFrequency]);

  const preferredDays = goalSummary.preferredDays || [];

  return (
    <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-app" />
          <div>
            <h3 className="text-sm font-bold text-white">Meta Semanal & Regularidade</h3>
            <p className="text-[11px] text-slate-400">
              {goalSummary.isActive
                ? `${goalSummary.targetWorkoutsPerWeek} treinos por semana`
                : 'Meta inativa'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
          title="Configurar metas e lembretes"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span className="hidden sm:inline">Ajustar Meta</span>
        </button>
      </div>

      {/* Main KPI & Progress Bar */}
      <div className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            Cumprimento da Semana Atual:
          </span>
          <span className="text-xs font-black" style={{ color: themeConfig.primaryHex }}>
            {goalSummary.currentWeekCompleted} de {goalSummary.targetWorkoutsPerWeek} treinos (
            {goalSummary.currentWeekCompliancePercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 rounded-full bg-[#0B0F14] border border-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${goalSummary.currentWeekCompliancePercent}%`,
              backgroundColor: themeConfig.primaryHex,
            }}
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-primary-app" />
            <span>
              {goalSummary.isCurrentWeekGoalMet
                ? 'Meta semanal atingida com sucesso!'
                : `Falta${
                    goalSummary.targetWorkoutsPerWeek - goalSummary.currentWeekCompleted > 1
                      ? 'm'
                      : ''
                  } ${
                    goalSummary.targetWorkoutsPerWeek - goalSummary.currentWeekCompleted
                  } treino(s) para a meta`}
            </span>
          </div>

          {goalSummary.isCurrentWeekGoalMet && (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluída</span>
            </span>
          )}
        </div>
      </div>

      {/* Preferred Days Pills */}
      {preferredDays.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Dias Preferidos de Treinamento:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 0].map((dayId) => {
              const isPreferred = preferredDays.includes(dayId);
              return (
                <span
                  key={dayId}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    isPreferred
                      ? 'bg-primary-surface text-primary-app border-primary-app'
                      : 'bg-[#0B0F14] text-slate-600 border-white/5'
                  }`}
                >
                  {WEEK_DAY_LABELS[dayId]}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Evolution History */}
      <div className="pt-2 border-t border-white/5 space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
          Evolução Mensal de Regularidade:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {goalSummary.monthlyHistory.slice(0, 6).map((m) => (
            <div
              key={m.monthKey}
              className="p-2.5 rounded-xl bg-surface-elevated border border-white/5 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{m.monthLabel}</span>
                <span
                  className="font-bold"
                  style={{ color: m.compliancePercentage >= 100 ? '#34D399' : themeConfig.primaryHex }}
                >
                  {m.compliancePercentage}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block">
                {m.completedWorkouts} de {m.targetWorkouts} treinos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
