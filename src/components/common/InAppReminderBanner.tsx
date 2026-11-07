/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Bell, X, Dumbbell, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { checkLocalReminderTrigger } from '../../utils/goalAndSummaryCalculator';
import { NavigationTab } from '../../types';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
}

export const InAppReminderBanner: React.FC<Props> = ({ onNavigate }) => {
  const { themeConfig } = useTheme();
  const { preferences, savePreferences } = useUser();

  const [activeTrigger, setActiveTrigger] = useState<{
    currentDate: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const checkReminder = () => {
      const trigger = checkLocalReminderTrigger(preferences.reminderConfig);
      if (trigger && trigger.shouldTrigger) {
        setActiveTrigger({
          currentDate: trigger.currentDate,
          message: trigger.message,
        });
      }
    };

    checkReminder();
    const interval = setInterval(checkReminder, 15000); // Checa a cada 15 segundos
    return () => clearInterval(interval);
  }, [preferences.reminderConfig]);

  if (!activeTrigger) return null;

  const handleDismiss = async () => {
    if (preferences.reminderConfig) {
      await savePreferences({
        reminderConfig: {
          ...preferences.reminderConfig,
          lastShownDate: activeTrigger.currentDate,
        },
      });
    }
    setActiveTrigger(null);
  };

  const handleGoToWorkout = async () => {
    await handleDismiss();
    onNavigate('plan');
  };

  return (
    <div className="sticky top-16 z-30 w-full px-4 py-2 animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto p-4 rounded-2xl bg-[#121820] border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
        <div
          className="absolute -left-10 -top-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeConfig.primaryHex }}
        />

        <div className="flex items-start gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400">Lembrete de Treino</span>
              <span className="text-[10px] font-semibold text-slate-400">Hoje</span>
            </div>
            <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">
              {activeTrigger.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            onClick={handleGoToWorkout}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm"
            style={{ backgroundColor: themeConfig.primaryHex }}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Treinar Agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Fechar lembrete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
