/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  FastForward,
  Info,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  DEFAULT_EXERCISES_CATALOG,
  MUSCLE_GROUP_LABELS,
  isExerciseCompatibleWithGym,
} from '../../constants/exercisesCatalog';
import { useEquipments } from '../../context/EquipmentsContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import { ExerciseItem, WorkoutSessionExerciseLog, WorkoutSessionSetLog } from '../../types';
import { ExerciseDetailModal } from '../exercises/ExerciseDetailModal';
import { ExerciseIllustration } from '../exercises/ExerciseIllustration';
import { WorkoutRestTimerOverlay } from './WorkoutRestTimerOverlay';

interface WorkoutExecutionViewProps {
  onMinimize: () => void;
  onFinish?: () => void;
}

export function WorkoutExecutionView({ onMinimize, onFinish }: WorkoutExecutionViewProps) {
  const {
    activeSession,
    updateActiveSession,
    pauseActiveSession,
    resumeActiveSession,
    finishActiveSession,
    discardActiveSession,
    startRestTimer,
    persistenceError,
    clearPersistenceError,
  } = useWorkout();
  const { selectedIds, customEquipments, explicitCustomCompatibilityMap } = useEquipments();
  const { getExerciseById } = useCustomExercises();

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [savingSetNumber, setSavingSetNumber] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [detailModalExercise, setDetailModalExercise] = useState<ExerciseItem | null>(null);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');

  // Sincroniza cronômetro decorrido baseado no estado temporal persistido da sessão
  useEffect(() => {
    if (!activeSession) return;

    const updateTimer = () => {
      const baseActive = Math.max(0, activeSession.elapsedActiveSeconds || 0);
      if (activeSession.isPaused) {
        setElapsedSeconds(baseActive);
        return;
      }
      const resumedMs = activeSession.lastResumedAt
        ? new Date(activeSession.lastResumedAt).getTime()
        : new Date(activeSession.startTime).getTime();
      const currentDelta = Math.max(0, Math.floor((Date.now() - resumedMs) / 1000));
      setElapsedSeconds(baseActive + currentDelta);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Formatação do tempo HH:MM:SS
  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [elapsedSeconds]);

  if (!activeSession || !activeSession.exerciseLogs || activeSession.exerciseLogs.length === 0) {
    return null;
  }

  const exerciseLogs = activeSession.exerciseLogs;
  const currentExLog: WorkoutSessionExerciseLog =
    exerciseLogs[currentExerciseIndex] || exerciseLogs[0];
  const catalogEntry = getExerciseById(currentExLog.exerciseId);

  // Informações de compatibilidade com a academia atual
  const isCompatible = catalogEntry
    ? isExerciseCompatibleWithGym(
        catalogEntry,
        selectedIds,
        explicitCustomCompatibilityMap,
        customEquipments
      )
    : true;

  const handleTogglePause = async () => {
    try {
      setLocalError(null);
      if (activeSession.isPaused) {
        await resumeActiveSession();
      } else {
        await pauseActiveSession();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao alternar pausa do treino';
      setLocalError(msg);
    }
  };

  // Alterna status de conclusão de uma série aguardando persistência real no IndexedDB
  const handleToggleSetCompletion = async (setNumber: number) => {
    const targetSet = currentExLog.sets.find((s) => s.setNumber === setNumber);
    if (!targetSet) return;
    const willBeCompleted = !targetSet.completed;

    setSavingSetNumber(setNumber);
    setLocalError(null);

    try {
      await updateActiveSession((prev) => {
        const updatedLogs = (prev.exerciseLogs || []).map((exLog) => {
          if (exLog.exerciseId !== currentExLog.exerciseId) return exLog;
          const updatedSets = exLog.sets.map((s) => {
            if (s.setNumber !== setNumber) return s;
            return {
              ...s,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            };
          });
          return { ...exLog, sets: updatedSets };
        });
        return { ...prev, exerciseLogs: updatedLogs };
      });

      // Dispara o timer de descanso SOMENTE após confirmação formal da persistência no IndexedDB
      if (willBeCompleted) {
        startRestTimer(60);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar série no banco de dados';
      setLocalError(msg);
    } finally {
      setSavingSetNumber(null);
    }
  };

  // Atualiza valores reais digitados em uma série (reps ou carga)
  const handleUpdateSetValues = async (
    setNumber: number,
    field: 'actualReps' | 'actualWeightKg',
    value: number
  ) => {
    const val = Math.max(0, value);
    await updateActiveSession((prev) => {
      const updatedLogs = (prev.exerciseLogs || []).map((exLog) => {
        if (exLog.exerciseId !== currentExLog.exerciseId) return exLog;
        const updatedSets = exLog.sets.map((s) => {
          if (s.setNumber !== setNumber) return s;
          return { ...s, [field]: val };
        });
        return { ...exLog, sets: updatedSets };
      });
      return { ...prev, exerciseLogs: updatedLogs };
    });
  };

  // Adiciona série extra
  const handleAddExtraSet = async () => {
    const nextSetNumber = currentExLog.sets.length + 1;
    const lastSet = currentExLog.sets[currentExLog.sets.length - 1];

    const newSet: WorkoutSessionSetLog = {
      setNumber: nextSetNumber,
      prescribedReps: lastSet ? lastSet.prescribedReps : '10-12',
      prescribedWeightKg: lastSet ? lastSet.prescribedWeightKg : undefined,
      actualReps: lastSet ? lastSet.actualReps : 10,
      actualWeightKg: lastSet ? lastSet.actualWeightKg : 0,
      completed: false,
    };

    await updateActiveSession((prev) => {
      const updatedLogs = (prev.exerciseLogs || []).map((exLog) => {
        if (exLog.exerciseId !== currentExLog.exerciseId) return exLog;
        return { ...exLog, sets: [...exLog.sets, newSet] };
      });
      return { ...prev, exerciseLogs: updatedLogs };
    });
  };

  // Alterna status de pular exercício
  const handleToggleSkipExercise = async () => {
    const nextSkipped = !currentExLog.skipped;
    await updateActiveSession((prev) => {
      const updatedLogs = (prev.exerciseLogs || []).map((exLog) => {
        if (exLog.exerciseId !== currentExLog.exerciseId) return exLog;
        return { ...exLog, skipped: nextSkipped };
      });
      return { ...prev, exerciseLogs: updatedLogs };
    });
  };

  // Finalização oficial
  const handleConfirmFinish = async () => {
    try {
      await finishActiveSession(sessionNotes.trim() || undefined);
      setIsFinishModalOpen(false);
      if (onFinish) onFinish();
    } catch (e) {
      console.error('Falha ao concluir treino:', e);
    }
  };

  // Descarte
  const handleConfirmDiscard = async () => {
    try {
      await discardActiveSession();
      setIsDiscardConfirmOpen(false);
      onMinimize();
    } catch (e) {
      console.error('Falha ao descartar treino:', e);
    }
  };

  // Cálculo de estatísticas atuais
  const completedSetsCount = exerciseLogs.reduce(
    (acc, ex) => acc + (ex.skipped ? 0 : ex.sets.filter((s) => s.completed).length),
    0
  );
  const totalSetsCount = exerciseLogs.reduce(
    (acc, ex) => acc + (ex.skipped ? 0 : ex.sets.length),
    0
  );
  const currentVolume = activeSession.totalVolumeKg || 0;

  return (
    <div className="min-h-screen bg-app-dark text-slate-100 flex flex-col pb-28 animate-fadeIn">
      {/* Top Bar Fixa de Execução */}
      <div className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onMinimize}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Minimizar (o treino continuará ativo em segundo plano)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-sm font-bold text-white truncate">
                  {activeSession.divisionName}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {activeSession.planName || 'Ficha de Treino'}
              </p>
            </div>
          </div>

          {/* Central Timer & Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 font-mono text-sm font-bold text-orange-400 shadow-inner">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>{formattedTime}</span>
            </div>

            <button
              onClick={handleTogglePause}
              className={`p-2 rounded-lg border transition-colors ${
                activeSession.isPaused
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={activeSession.isPaused ? 'Retomar treino' : 'Pausar treino'}
            >
              {activeSession.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsFinishModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all"
            >
              <Check className="w-4 h-4" /> Finalizar
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de Confiabilidade / Erro de Persistência */}
      {(persistenceError || localError) && (
        <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 pt-3">
          <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center justify-between shadow-lg">
            <span className="font-medium">
              Aviso de Confiabilidade: {persistenceError || localError}
            </span>
            <button
              onClick={() => {
                setLocalError(null);
                clearPersistenceError();
              }}
              className="p-1 text-red-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 pt-4 space-y-4">
        {/* Exercícios Carousel / Mini Drawer */}
        <div className="flex items-center justify-between gap-2 bg-slate-850 border border-slate-800/80 rounded-2xl p-2.5">
          <button
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-xl hover:bg-slate-800 transition-colors"
            title="Exercício anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Exercise chips list */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-thin flex-1 justify-center">
            {exerciseLogs.map((exLog, idx) => {
              const isSelected = idx === currentExerciseIndex;
              const isAllSetsCompleted =
                exLog.sets.length > 0 && exLog.sets.every((s) => s.completed);
              const hasSomeCompleted = exLog.sets.some((s) => s.completed);

              return (
                <button
                  key={exLog.exerciseId || idx}
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-400 shadow-md scale-105'
                      : isAllSetsCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : hasSomeCompleted
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : exLog.skipped
                      ? 'bg-slate-800/50 text-slate-500 border-slate-800 line-through'
                      : 'bg-slate-800 text-slate-300 border-slate-700/80'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  <span className="max-w-[100px] sm:max-w-[130px] truncate">
                    {exLog.exerciseName}
                  </span>
                  {isAllSetsCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentExerciseIndex === exerciseLogs.length - 1}
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 rounded-xl hover:bg-slate-800 transition-colors"
            title="Próximo exercício"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Card do Exercício Atual em Destaque */}
        <div className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Header do Exercício */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-black text-lg">
                {currentExerciseIndex + 1}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {currentExLog.exerciseName}
                  </h2>
                  {catalogEntry && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {MUSCLE_GROUP_LABELS[catalogEntry.primaryMuscleGroup]}
                    </span>
                  )}
                  {isCompatible ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Na sua academia
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                      Equipamento ausente
                    </span>
                  )}
                </div>
                {currentExLog.notes && (
                  <p className="text-xs text-orange-400 font-medium mt-0.5">
                    Instrutor: {currentExLog.notes}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {catalogEntry && (
                <button
                  onClick={() => setDetailModalExercise(catalogEntry)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                  <span>Ver Técnica e Biomecânica</span>
                </button>
              )}

              <button
                onClick={handleToggleSkipExercise}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 ${
                  currentExLog.skipped
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-700'
                }`}
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{currentExLog.skipped ? 'Retomar Exercício' : 'Pular Exercício'}</span>
              </button>
            </div>
          </div>

          {/* Imagem 3D Oficial Realista do Exercício */}
          <div className="relative aspect-video max-h-72 w-full bg-slate-950 flex items-center justify-center p-2 border-b border-slate-800">
            <ExerciseIllustration
              exerciseId={currentExLog.exerciseId}
              exerciseName={currentExLog.exerciseName}
              muscleGroup={catalogEntry?.primaryMuscleGroup || 'peito'}
              size="lg"
            />
            {currentExLog.skipped && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
                <span className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-sm">
                  Exercício Marcado como Pulado
                </span>
              </div>
            )}
          </div>

          {/* Tabela de Séries e Execução Real */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-orange-400" /> Séries e Registro de Cargas
              </h3>
              <span className="text-xs text-slate-400">
                {currentExLog.sets.filter((s) => s.completed).length} de {currentExLog.sets.length}{' '}
                concluídas
              </span>
            </div>

            {/* Lista de Séries */}
            <div className="space-y-2.5">
              {currentExLog.sets.map((setLog) => {
                return (
                  <div
                    key={setLog.setNumber}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      setLog.completed
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Set Number & Prescription Target */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          setLog.completed
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {setLog.setNumber}
                      </div>

                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Prescrito
                        </span>
                        <span className="text-white font-medium">
                          {setLog.prescribedReps} reps
                          {setLog.prescribedWeightKg ? ` • ${setLog.prescribedWeightKg} kg` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Inputs: Carga Real (kg) e Repetições Reais */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-sm">
                      {/* Carga Real */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSetValues(
                              setLog.setNumber,
                              'actualWeightKg',
                              Math.max(0, setLog.actualWeightKg - 2)
                            )
                          }
                          className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <div className="text-center w-12">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={setLog.actualWeightKg}
                            onChange={(e) =>
                              handleUpdateSetValues(
                                setLog.setNumber,
                                'actualWeightKg',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full text-center bg-transparent font-bold text-white text-xs focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-500 block leading-none">kg</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSetValues(
                              setLog.setNumber,
                              'actualWeightKg',
                              setLog.actualWeightKg + 2
                            )
                          }
                          className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Repetições Reais */}
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSetValues(
                              setLog.setNumber,
                              'actualReps',
                              Math.max(1, setLog.actualReps - 1)
                            )
                          }
                          className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <div className="text-center w-10">
                          <input
                            type="number"
                            min="1"
                            value={setLog.actualReps}
                            onChange={(e) =>
                              handleUpdateSetValues(
                                setLog.setNumber,
                                'actualReps',
                                parseInt(e.target.value, 10) || 1
                              )
                            }
                            className="w-full text-center font-bold text-white text-xs focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-500 block leading-none">reps</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSetValues(
                              setLog.setNumber,
                              'actualReps',
                              setLog.actualReps + 1
                            )
                          }
                          className="w-5 h-5 rounded bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      {/* Checkmark Botão de Concluir Série */}
                      <button
                        type="button"
                        disabled={savingSetNumber === setLog.setNumber}
                        onClick={() => handleToggleSetCompletion(setLog.setNumber)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                          savingSetNumber === setLog.setNumber
                            ? 'opacity-60 cursor-wait'
                            : ''
                        } ${
                          setLog.completed
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-105'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                        title={setLog.completed ? 'Série concluída (clique para reabrir)' : 'Concluir série'}
                      >
                        {savingSetNumber === setLog.setNumber ? (
                          <div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-5 h-5 font-bold" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ações inferiores da série */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleAddExtraSet}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 hover:underline"
              >
                + Adicionar Série Extra (Drop-set / Adicional)
              </button>

              <div className="flex items-center gap-2">
                {currentExerciseIndex < exerciseLogs.length - 1 ? (
                  <button
                    onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
                    className="flex items-center gap-1 text-xs px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors"
                  >
                    <span>Próximo Exercício</span>
                    <ChevronRight className="w-4 h-4 text-orange-400" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsFinishModalOpen(true)}
                    className="flex items-center gap-1 text-xs px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors shadow-md shadow-orange-500/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>Concluir Treino</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Dinâmico da Sessão */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Séries Feitas
            </span>
            <span className="text-base sm:text-lg font-bold text-white">
              {completedSetsCount} / {totalSetsCount}
            </span>
          </div>

          <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Volume Levantado
            </span>
            <span className="text-base sm:text-lg font-bold text-orange-400">
              {currentVolume.toLocaleString('pt-BR')} kg
            </span>
          </div>

          <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              Exercícios
            </span>
            <span className="text-base sm:text-lg font-bold text-white">
              {exerciseLogs.filter((e) => e.sets.some((s) => s.completed)).length} /{' '}
              {exerciseLogs.length}
            </span>
          </div>
        </div>

        {/* Opção de Descarte de Treino */}
        <div className="text-center pt-2">
          <button
            onClick={() => setIsDiscardConfirmOpen(true)}
            className="text-xs text-red-400/80 hover:text-red-300 hover:underline flex items-center gap-1 mx-auto"
          >
            <Trash2 className="w-3.5 h-3.5" /> Descartar esta sessão em andamento
          </button>
        </div>
      </div>

      {/* Floating Rest Timer Overlay */}
      <WorkoutRestTimerOverlay />

      {/* Modal de Detalhes Biomecânicos do Exercício */}
      {detailModalExercise && (
        <ExerciseDetailModal
          exercise={detailModalExercise}
          onClose={() => setDetailModalExercise(null)}
        />
      )}

      {/* Modal de Confirmação de Finalização */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Finalizar Treino</h3>
              <p className="text-xs text-slate-400">
                Parabéns! Você completou sua sessão de musculação de hoje.
              </p>
            </div>

            {/* Estatísticas Finais */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Tempo Total</span>
                <span className="text-sm font-bold text-white">{formattedTime}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Volume Total</span>
                <span className="text-sm font-bold text-orange-400">
                  {currentVolume.toLocaleString('pt-BR')} kg
                </span>
              </div>
            </div>

            {/* Anotações da Sessão */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Anotações do Treino (Opcional)</label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Ex: Treino muito intenso, aumentei 2kg no supino, ótima recuperação..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="flex-1 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Voltar ao Treino
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
              >
                <Check className="w-4 h-4" /> Salvar no Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Descarte */}
      {isDiscardConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Descartar Treino Atual?</h3>
              <p className="text-xs text-slate-400">
                Tem certeza que deseja cancelar esta sessão? Todos os registros de séries feitos hoje serão apagados.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Sim, Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
