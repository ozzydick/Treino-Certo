/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Dumbbell,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { WorkoutSessionItem } from '../../types';

interface ActivityCalendarProps {
  completedSessions: WorkoutSessionItem[];
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  completedSessions,
}) => {
  const { themeConfig } = useTheme();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Mapa de sessões por data (YYYY-MM-DD)
  const sessionsByDate = React.useMemo(() => {
    const map = new Map<string, WorkoutSessionItem[]>();
    for (const s of completedSessions) {
      if (!s.isCompleted || !s.startTime) continue;
      const dateKey = s.startTime.split('T')[0] || s.startTime.slice(0, 10);
      const list = map.get(dateKey) || [];
      list.push(s);
      map.set(dateKey, list);
    }
    return map;
  }, [completedSessions]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const monthName = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(currentMonthDate);

  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  // Dias do mês
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Seg = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    workoutCount: number;
    sessions: WorkoutSessionItem[];
  }> = [];

  // Dias em branco antes do início do mês
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push({
      dateStr: `prev_${i}`,
      dayNum: 0,
      isCurrentMonth: false,
      workoutCount: 0,
      sessions: [],
    });
  }

  // Dias do mês atual
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const daySessions = sessionsByDate.get(dateStr) || [];
    calendarDays.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      workoutCount: daySessions.length,
      sessions: daySessions,
    });
  }

  const selectedSessions = sessionsByDate.get(selectedDayStr) || [];

  return (
    <div className="space-y-4">
      {/* Calendar Header Navigation */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-app" />
            <h3 className="text-base font-bold text-white">{capitalizedMonth}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
            <span
              key={d}
              className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 py-1"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return <div key={`empty_${idx}`} className="h-10 sm:h-12" />;
            }

            const isSelected = cell.dateStr === selectedDayStr;
            const hasWorkouts = cell.workoutCount > 0;

            return (
              <button
                key={cell.dateStr}
                onClick={() => setSelectedDayStr(cell.dateStr)}
                className={`relative h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 transition select-none ${
                  isSelected
                    ? 'border-2 bg-surface-elevated'
                    : hasWorkouts
                    ? 'bg-[#121820] hover:bg-surface-elevated border border-white/10'
                    : 'bg-transparent hover:bg-white/5 border border-transparent'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: themeConfig.primaryHex,
                        boxShadow: `0 0 12px rgba(${themeConfig.rgb}, 0.25)`,
                      }
                    : undefined
                }
              >
                <span
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-white'
                      : hasWorkouts
                      ? 'text-slate-200'
                      : 'text-slate-500'
                  }`}
                >
                  {cell.dayNum}
                </span>

                {/* Workout indicator dot / badge */}
                {hasWorkouts && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(3, cell.workoutCount) }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: themeConfig.primaryHex }}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Workouts List */}
      <div className="p-4 sm:p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-app" />
            <span>Treinos do dia {selectedDayStr.split('-').reverse().join('/')}</span>
          </span>
          <span className="text-xs text-slate-400">
            {selectedSessions.length === 1
              ? '1 treino concluído'
              : `${selectedSessions.length} treinos concluídos`}
          </span>
        </div>

        {selectedSessions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            Nenhuma sessão de treino concluída nesta data.
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSessions.map((session) => {
              const durationMin = Math.round(
                (session.elapsedActiveSeconds || session.durationSeconds || 0) / 60
              );
              const totalVolume = session.totalVolumeKg || 0;

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary-app block">
                        {session.planName || 'Ficha do Instrutor'}
                      </span>
                      <h4 className="text-sm font-black text-white mt-0.5">
                        {session.divisionName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{durationMin} min</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{totalVolume.toLocaleString('pt-BR')} kg</span>
                      </span>
                    </div>
                  </div>

                  {/* Exercises Details */}
                  {session.exerciseLogs && session.exerciseLogs.length > 0 && (
                    <div className="pt-2 border-t border-white/5 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                        Exercícios Executados:
                      </span>
                      <div className="space-y-1.5">
                        {session.exerciseLogs.map((log, lIdx) => {
                          if (log.skipped) return null;
                          const completedSets =
                            log.sets?.filter((s) => s.completed) || [];
                          if (completedSets.length === 0) return null;

                          return (
                            <div
                              key={lIdx}
                              className="p-2 rounded-xl bg-[#0B0F14] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                            >
                              <div className="flex items-center gap-1.5">
                                <Dumbbell className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-white">
                                  {log.exerciseName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex flex-wrap gap-1.5">
                                {completedSets.map((st, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-1.5 py-0.5 rounded bg-surface-elevated text-slate-300 border border-white/5"
                                  >
                                    {st.actualWeightKg}kg × {st.actualReps}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
