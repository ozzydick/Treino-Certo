/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  History,
  Trash2,
  TrendingUp,
  Weight,
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutSessionItem } from '../../types';

interface WorkoutHistoryViewProps {
  onBack: () => void;
}

export function WorkoutHistoryView({ onBack }: WorkoutHistoryViewProps) {
  const { sessionsHistory, deleteSessionHistory } = useWorkout();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const totalAccumulatedVolume = sessionsHistory.reduce(
    (acc, s) => acc + (s.totalVolumeKg || 0),
    0
  );

  const totalTimeSeconds = sessionsHistory.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const totalHours = Math.floor(totalTimeSeconds / 3600);
  const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

  const handleDelete = async (id: string) => {
    await deleteSessionHistory(id);
    setSessionToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Minha Ficha
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Histórico de Treinos</h1>
            <p className="text-xs text-slate-400">
              Registro real de cada sessão executada, volume total levantado e evolução
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Treinos Concluídos
            </span>
            <span className="text-xl font-bold text-white">{sessionsHistory.length}</span>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Volume Total Acumulado
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {totalAccumulatedVolume.toLocaleString('pt-BR')} kg
            </span>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Tempo em Musculação
            </span>
            <span className="text-xl font-bold text-white">
              {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes} min`}
            </span>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {sessionsHistory.length === 0 ? (
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Dumbbell className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-white">Nenhum treino registrado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Quando você iniciar e concluir uma sessão de musculação através da sua ficha, ela aparecerá aqui com todos os detalhes de séries, repetições e cargas.
            </p>
          </div>
        ) : (
          sessionsHistory.map((session: WorkoutSessionItem) => {
            const isExpanded = expandedSessionId === session.id;
            const startDate = new Date(session.startTime);
            const formattedDate = startDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const formattedTime = startDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const durationMin = Math.round((session.durationSeconds || 0) / 60);

            return (
              <div
                key={session.id}
                className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Header card */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{session.divisionName}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                          {session.planName || 'Ficha'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {formattedDate} às{' '}
                          {formattedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {durationMin} min
                        </span>
                        <span className="flex items-center gap-1 text-orange-400 font-semibold">
                          <Weight className="w-3.5 h-3.5" />{' '}
                          {(session.totalVolumeKg || 0).toLocaleString('pt-BR')} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 space-y-4">
                    {session.notes && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                        <strong className="text-orange-400 block mb-0.5">
                          Observações da Sessão:
                        </strong>
                        {session.notes}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Detalhamento dos Exercícios e Séries
                      </h4>

                      {session.exerciseLogs && session.exerciseLogs.length > 0 ? (
                        session.exerciseLogs.map((exLog, exIdx) => {
                          const completedSets = exLog.sets.filter((s) => s.completed);

                          return (
                            <div
                              key={exLog.exerciseId || exIdx}
                              className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white">
                                  #{exIdx + 1} {exLog.exerciseName}
                                </span>
                                {exLog.skipped ? (
                                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    Pulado
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {completedSets.length} / {exLog.sets.length} séries
                                  </span>
                                )}
                              </div>

                              {/* Sets list */}
                              {!exLog.skipped && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                  {exLog.sets.map((setLog) => (
                                    <div
                                      key={setLog.setNumber}
                                      className={`p-2 rounded-lg border text-center ${
                                        setLog.completed
                                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                                          : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                                      }`}
                                    >
                                      <span className="text-[9px] text-slate-500 block uppercase">
                                        Série {setLog.setNumber}
                                      </span>
                                      <span className="font-bold text-white">
                                        {setLog.actualReps} reps × {setLog.actualWeightKg} kg
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500">
                          {session.exercisesCompleted} exercícios registrados.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Excluir Registro de Treino?</h3>
            <p className="text-xs text-slate-400">
              Esta ação removerá este treino do seu histórico e atualizará suas estatísticas. Deseja continuar?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sessionToDelete)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
