/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FastForward,
  Minimize2,
  Minus,
  Plus,
  Timer,
  Volume2,
  X,
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
  } = useWorkout();
  const { preferences } = useUser();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!isRestTimerActive || restTimerSeconds <= 0) return null;

  const formattedTime = formatRestTimerDisplay(restTimerSeconds);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((restTimerTotal - restTimerSeconds) / (restTimerTotal || 1)) * 100)
  );

  // MODO MINIMIZADO: painel compacto, visível, contagem contínua e sem afetar prazo ou alertas
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] bg-slate-900/95 border-2 border-orange-500/80 rounded-full shadow-2xl backdrop-blur-md px-3.5 py-2 flex items-center justify-between gap-3 animate-slideUp">
        {/* Progress indicator bottom bar */}
        <div className="absolute bottom-0 left-4 right-4 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Left: Mini icon & countdown */}
        <div
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 cursor-pointer flex-1"
          title="Clique para expandir o painel de descanso"
        >
          <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-pulse shrink-0">
            <Timer className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              Descanso
            </span>
            <span className="text-xl font-black text-white font-mono tracking-tight leading-none">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Right: Quick actions (Expandir & Pular) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Expandir painel de descanso"
          >
            <ChevronUp className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Expandir</span>
          </button>
          <button
            onClick={stopRestTimer}
            className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors flex items-center gap-1 text-xs font-bold shadow-sm"
            title="Pular intervalo de descanso"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pular</span>
          </button>
        </div>
      </div>
    );
  }

  // MODO EXPANDIDO: controles completos (+30s, -10s, pular, minimizar e fechar)
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md bg-slate-900/95 border-2 border-orange-500/80 rounded-2xl shadow-2xl backdrop-blur-md p-4 animate-slideUp">
      {/* Progress bar background */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800 rounded-t-2xl overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Left: Icon & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 animate-pulse">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
                Intervalo de Descanso
              </span>
              {preferences.soundAlerts && (
                <span title="Alerta sonoro ativo">
                  <Volume2 className="w-3 h-3 text-slate-500" />
                </span>
              )}
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {formattedTime}
            </div>
          </div>
        </div>

        {/* Right: Controls (+30s, -10s, Pular, Minimizar, Fechar) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addRestTimerSeconds(-10)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reduzir 10 segundos"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => addRestTimerSeconds(30)}
            className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-0.5"
            title="Adicionar 30 segundos"
          >
            <Plus className="w-3.5 h-3.5" /> 30s
          </button>
          <button
            onClick={stopRestTimer}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-colors"
            title="Pular intervalo e ir para a próxima série"
          >
            <FastForward className="w-4 h-4" /> Pular
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Minimizar painel de descanso"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={stopRestTimer}
            className="p-2 text-slate-500 hover:text-slate-300 rounded-lg"
            title="Fechar timer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
