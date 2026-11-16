/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FastForward,
  Minus,
  Plus,
  Timer,
  Volume2,
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useUser } from '../../context/UserContext';
import { formatRestTimerDisplay } from '../../utils/restTimerHelper';

export function WorkoutRestTimerOverlay() {
  const {
    restTimerSeconds,
    restTimerTotal,
    isRestTimerActive,
    stopRestTimer,
    addRestTimerSeconds,
    startRestTimer,
  } = useWorkout();
  const { preferences } = useUser();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isRestTimerActive || restTimerSeconds <= 0) return null;

  const formattedTime = formatRestTimerDisplay(restTimerSeconds);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((restTimerTotal - restTimerSeconds) / (restTimerTotal || 1)) * 100)
  );

  if (isMinimized) {
    return (
      <section
        aria-label="Temporizador de descanso minimizado"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[94%] bg-slate-900/95 border-2 border-orange-500/80 rounded-full shadow-2xl backdrop-blur-md px-3.5 py-2 flex items-center justify-between gap-2 animate-slideUp"
      >
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          title="Expandir temporizador de descanso"
          aria-label={`Expandir temporizador. Restam ${formattedTime}`}
        >
          <span className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Timer className="w-4 h-4" />
          </span>
          <span className="flex items-baseline gap-2 min-w-0">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">Descanso</span>
            <span className="text-xl font-black text-white font-mono tracking-tight leading-none tabular-nums" aria-live="off">{formattedTime}</span>
          </span>
        </button>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="min-w-10 min-h-10 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Expandir painel"
            aria-label="Expandir painel de descanso"
          >
            <ChevronUp className="w-4 h-4 text-orange-400" />
          </button>
          <button
            type="button"
            onClick={stopRestTimer}
            className="min-w-10 min-h-10 px-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center justify-center gap-1 text-xs font-bold"
            title="Pular descanso"
            aria-label="Pular intervalo de descanso"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pular</span>
          </button>
        </div>
        <div className="absolute bottom-0 left-4 right-4 h-1 bg-slate-800 rounded-full overflow-hidden" aria-hidden="true">
          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-linear" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Temporizador de descanso"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md bg-slate-900/95 border-2 border-orange-500/80 rounded-2xl shadow-2xl backdrop-blur-md p-3.5 sm:p-4 animate-slideUp"
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 rounded-t-2xl overflow-hidden" aria-hidden="true">
        <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-linear" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Timer className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">Intervalo de descanso</span>
              {preferences.soundAlerts && <span title="Alerta sonoro ativo"><Volume2 className="w-3 h-3 text-slate-500" /></span>}
            </div>
            <div
              className="text-3xl font-black text-white font-mono tracking-tight tabular-nums"
              role="timer"
              aria-label={`Tempo restante: ${formattedTime}`}
              aria-live="off"
            >
              {formattedTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => addRestTimerSeconds(-10)}
            disabled={restTimerSeconds <= 10}
            className="min-w-10 min-h-10 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            title="Reduzir 10 segundos"
            aria-label="Reduzir 10 segundos do descanso"
          ><Minus className="w-4 h-4" /></button>
          <button
            type="button"
            onClick={() => addRestTimerSeconds(30)}
            className="min-h-10 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
            title="Adicionar 30 segundos"
            aria-label="Adicionar 30 segundos ao descanso"
          ><Plus className="w-3.5 h-3.5" />30s</button>
          <button
            type="button"
            onClick={() => addRestTimerSeconds(60)}
            className="min-h-10 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors hidden sm:inline-flex items-center gap-1"
            title="Adicionar 60 segundos"
            aria-label="Adicionar 60 segundos ao descanso"
          ><Plus className="w-3.5 h-3.5" />60s</button>
          <button
            type="button"
            onClick={stopRestTimer}
            className="min-h-10 flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-colors"
            title="Pular intervalo e ir para a próxima série"
            aria-label="Pular intervalo de descanso"
          ><FastForward className="w-4 h-4" /><span>Pular</span></button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="min-w-10 min-h-10 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Minimizar painel de descanso"
            aria-label="Minimizar temporizador de descanso"
          ><ChevronDown className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ajuste rápido</span>
        <div className="flex items-center gap-1.5" role="group" aria-label="Definir duração do descanso">
          {[60, 90, 120].map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => startRestTimer(seconds)}
              aria-label={`Reiniciar descanso para ${seconds} segundos`}
              aria-pressed={restTimerTotal === seconds && restTimerSeconds <= seconds}
              className={`min-h-9 rounded-lg border px-3 text-[11px] font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                restTimerTotal === seconds && restTimerSeconds <= seconds
                  ? 'border-orange-500/60 bg-orange-500/15 text-orange-300'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-orange-500/40 hover:text-white'
              }`}
            >
              {seconds / 60}:00
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-slate-500">
        <span>Progresso do intervalo</span>
        <span className="tabular-nums">{Math.round(progressPercent)}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progresso do intervalo de descanso"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressPercent)}
        className="mt-1 h-1.5 rounded-full bg-slate-800 overflow-hidden"
      >
        <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-linear" style={{ width: `${progressPercent}%` }} />
      </div>
    </section>
  );
}
