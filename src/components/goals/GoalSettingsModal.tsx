/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Target, Bell, Calendar, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { LocalReminderConfig, WorkoutGoalConfig } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

export const GoalSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { themeConfig } = useTheme();
  const { preferences, savePreferences, saveProfile, profile } = useUser();

  const currentGoal: WorkoutGoalConfig = preferences.goalConfig || {
    targetWorkoutsPerWeek: profile.weeklyFrequency || 3,
    preferredDays: [1, 3, 5],
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
  };

  const currentReminder: LocalReminderConfig = preferences.reminderConfig || {
    isActive: false,
    days: [1, 3, 5],
    time: '08:00',
    message: 'Hora do seu treino! Que tal manter a regularidade hoje?',
  };

  // State for Goal Config
  const [goalActive, setGoalActive] = useState(currentGoal.isActive);
  const [targetPerWeek, setTargetPerWeek] = useState(currentGoal.targetWorkoutsPerWeek);
  const [preferredDays, setPreferredDays] = useState<number[]>(currentGoal.preferredDays || [1, 3, 5]);
  const [startDate, setStartDate] = useState(currentGoal.startDate || new Date().toISOString().split('T')[0]);

  // State for Reminder Config
  const [reminderActive, setReminderActive] = useState(currentReminder.isActive);
  const [reminderDays, setReminderDays] = useState<number[]>(currentReminder.days || [1, 3, 5]);
  const [reminderTime, setReminderTime] = useState(currentReminder.time || '08:00');
  const [reminderMessage, setReminderMessage] = useState(currentReminder.message || '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const togglePreferredDay = (dayId: number) => {
    setPreferredDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const toggleReminderDay = (dayId: number) => {
    setReminderDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const updatedGoal: WorkoutGoalConfig = {
        targetWorkoutsPerWeek: targetPerWeek,
        preferredDays,
        startDate,
        isActive: goalActive,
      };

      const updatedReminder: LocalReminderConfig = {
        isActive: reminderActive,
        days: reminderDays,
        time: reminderTime,
        message: reminderMessage.trim() || undefined,
        lastShownDate: currentReminder.lastShownDate,
      };

      // Save preferences in IndexedDB
      await savePreferences({
        goalConfig: updatedGoal,
        reminderConfig: updatedReminder,
      });

      // Sync profile weeklyFrequency
      if (profile.weeklyFrequency !== targetPerWeek) {
        await saveProfile({
          ...profile,
          weeklyFrequency: targetPerWeek,
        });
      }

      onClose();
    } catch (err) {
      console.error('Erro ao salvar metas e lembretes:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-[#0F141C] border border-white/10 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-app" />
              <span>Metas & Lembretes Locais</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure sua meta semanal e lembretes internos no app
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: METAS DE TREINAMENTO */}
          <div className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-app" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Meta Pessoal de Frequência
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={goalActive}
                  onChange={(e) => setGoalActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-app" />
              </label>
            </div>

            {goalActive && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Weekly target count */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Quantidade de treinos desejada por semana
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTargetPerWeek(num)}
                        className={`py-2 rounded-xl font-bold text-xs transition border ${
                          targetPerWeek === num
                            ? 'bg-primary-surface text-primary-app border-primary-app'
                            : 'bg-[#0B0F14] text-slate-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dias preferidos para treinamento
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = preferredDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => togglePreferredDay(day.id)}
                          className={`py-2 rounded-xl text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-surface-elevated text-white border-primary-app'
                              : 'bg-[#0B0F14] text-slate-500 border-white/5 hover:text-slate-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Goal start date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Data de início da meta</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-xs text-white focus:outline-none focus:border-primary-app"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: LEMBRETES LOCAIS */}
          <div className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Lembrete de Treino no App
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderActive}
                  onChange={(e) => setReminderActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-400" />
              </label>
            </div>

            {reminderActive && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Days of week for reminder */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Dias dos lembretes
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = reminderDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleReminderDay(day.id)}
                          className={`py-2 rounded-xl text-xs font-semibold transition border ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                              : 'bg-[#0B0F14] text-slate-500 border-white/5 hover:text-slate-300'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Horário do lembrete</span>
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Custom message */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mensagem personalizada (opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Hora de treinar! Foco nos objetivos."
                    value={reminderMessage}
                    onChange={(e) => setReminderMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F14] border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400 placeholder:text-slate-600"
                  />
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * Os lembretes são exibidos em tela quando o aplicativo estiver aberto. Sem notificações em segundo plano.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition flex items-center gap-1.5"
              style={{
                backgroundColor: themeConfig.primaryHex,
                boxShadow: `0 2px 10px rgba(${themeConfig.rgb}, 0.3)`,
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
