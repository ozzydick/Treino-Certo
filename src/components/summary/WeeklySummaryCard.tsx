/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  CalendarDays,
  Dumbbell,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useWorkout } from '../../context/WorkoutContext';
import { calculateWeeklySummary } from '../../utils/goalAndSummaryCalculator';

export const WeeklySummaryCard: React.FC = () => {
  const { themeConfig } = useTheme();
  const { preferences, profile } = useUser();
  const { sessionsHistory } = useWorkout();

  const summary = useMemo(() => {
    return calculateWeeklySummary(
      sessionsHistory,
      preferences.goalConfig,
      profile.weeklyFrequency || 3
    );
  }, [sessionsHistory, preferences.goalConfig, profile.weeklyFrequency]);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 10000) {
      return `${(kg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`;
    }
    return `${kg.toLocaleString('pt-BR')} kg`;
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-surface border border-primary-app/30 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 text-primary-app" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Resumo Semanal Automático</h3>
            <p className="text-[11px] text-slate-400">
              Período: {summary.weekStartDate} a {summary.weekEndDate}
            </p>
          </div>
        </div>

        <span
          className="text-xs font-black px-2.5 py-1 rounded-full bg-surface-elevated border border-white/10"
          style={{ color: themeConfig.primaryHex }}
        >
          {summary.completedWorkouts}/{summary.targetWorkouts} treinos
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Workouts */}
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Treinos Concluídos
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {summary.completedWorkouts}
            </span>
            {summary.workoutsDelta !== 0 && (
              <span
                className={`text-[10px] font-bold flex items-center ${
                  summary.workoutsDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.workoutsDelta > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {summary.workoutsDelta > 0 ? '+' : ''}
                  {summary.workoutsDelta}
                </span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">
            vs semana anterior ({summary.previousWeekCompletedWorkouts})
          </span>
        </div>

        {/* Goal % */}
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Atingimento da Meta
          </span>
          <span className="text-xl font-black text-white block">
            {summary.compliancePercentage}%
          </span>
          <span className="text-[10px] text-slate-500 block">
            Meta: {summary.targetWorkouts} treinos/sem
          </span>
        </div>

        {/* Duration */}
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Tempo Ativo
          </span>
          <span className="text-xl font-black text-white block">
            {formatDuration(summary.activeDurationSeconds)}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Duração de treino acumulada
          </span>
        </div>

        {/* Volume */}
        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Volume Movimentado
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white">
              {formatVolume(summary.totalVolumeKg)}
            </span>
            {summary.volumeDeltaPercent !== 0 && (
              <span
                className={`text-[10px] font-bold flex items-center ${
                  summary.volumeDeltaKg > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.volumeDeltaKg > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {summary.volumeDeltaPercent > 0 ? '+' : ''}
                  {summary.volumeDeltaPercent}%
                </span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block">Carga total executada</span>
        </div>
      </div>

      {/* Highlights */}
      {summary.highlights.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-[#0B0F14] border border-white/5 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-app" />
            <span>Destaques da Semana:</span>
          </span>
          <div className="space-y-1.5">
            {summary.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
