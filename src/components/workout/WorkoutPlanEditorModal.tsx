/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Dumbbell,
  Layers,
  Plus,
  Repeat,
  Trash2,
  Weight,
  X,
} from 'lucide-react';
import { DEFAULT_EXERCISES_CATALOG, MUSCLE_GROUP_LABELS } from '../../constants/exercisesCatalog';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import { useWorkout } from '../../context/WorkoutContext';
import { ExerciseItem, WorkoutDivision, WorkoutPlanExercise, WorkoutPlanItem } from '../../types';
import { ExerciseIllustration } from '../exercises/ExerciseIllustration';
import { ExerciseSelectorModal } from './ExerciseSelectorModal';

interface WorkoutPlanEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  planToEdit?: WorkoutPlanItem | null;
}

export function WorkoutPlanEditorModal({
  isOpen,
  onClose,
  planToEdit,
}: WorkoutPlanEditorModalProps) {
  const { savePlan, workoutPlans } = useWorkout();
  const { getExerciseById } = useCustomExercises();

  // Basic Plan info
  const [name, setName] = useState(planToEdit?.name || '');
  const [version, setVersion] = useState<number>(planToEdit?.version || 1);
  const [isActive, setIsActive] = useState<boolean>(
    planToEdit ? planToEdit.isActive : workoutPlans.length === 0
  );
  const [startDate, setStartDate] = useState(
    planToEdit?.startDate || new Date().toISOString().split('T')[0]
  );
  const [reviewDate, setReviewDate] = useState(planToEdit?.reviewDate || '');
  const [notes, setNotes] = useState(planToEdit?.notes || '');
  const [instructorNotes, setInstructorNotes] = useState(planToEdit?.instructorNotes || '');

  // Divisions state
  const [divisions, setDivisions] = useState<WorkoutDivision[]>(
    planToEdit?.divisions && planToEdit.divisions.length > 0
      ? planToEdit.divisions
      : [
          {
            id: `div_${Date.now()}_a`,
            name: 'Treino A',
            muscleFocus: 'Peito, Ombros e Tríceps',
            exercises: [],
          },
        ]
  );

  const [activeDivisionIndex, setActiveDivisionIndex] = useState(0);
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentDivision = divisions[activeDivisionIndex] || divisions[0];

  const handleAddDivision = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const nextLetter = letters[divisions.length] || `${divisions.length + 1}`;
    const newDiv: WorkoutDivision = {
      id: `div_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Treino ${nextLetter}`,
      muscleFocus: 'Geral',
      exercises: [],
    };
    setDivisions([...divisions, newDiv]);
    setActiveDivisionIndex(divisions.length);
  };

  const handleRemoveDivision = (indexToRemove: number) => {
    if (divisions.length <= 1) {
      setErrorMsg('A ficha deve possuir pelo menos uma divisão de treino.');
      return;
    }
    const updated = divisions.filter((_, idx) => idx !== indexToRemove);
    setDivisions(updated);
    setActiveDivisionIndex(Math.max(0, indexToRemove - 1));
  };

  const handleUpdateDivisionMeta = (
    field: 'name' | 'muscleFocus',
    value: string
  ) => {
    setDivisions((prev) =>
      prev.map((div, idx) =>
        idx === activeDivisionIndex ? { ...div, [field]: value } : div
      )
    );
  };

  const handleAddExerciseToCurrentDivision = (exercise: ExerciseItem) => {
    const newEx: WorkoutPlanExercise = {
      id: `ex_item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: exercise.id,
      order: currentDivision.exercises.length + 1,
      prescribedSets: 3,
      prescribedReps: '10-12',
      prescribedWeightKg: undefined,
      restIntervalSeconds: 60,
      instructorNotes: '',
    };

    setDivisions((prev) =>
      prev.map((div, idx) =>
        idx === activeDivisionIndex
          ? { ...div, exercises: [...div.exercises, newEx] }
          : div
      )
    );
  };

  const handleUpdateExercise = (
    exerciseIndex: number,
    field: keyof WorkoutPlanExercise,
    value: unknown
  ) => {
    setDivisions((prev) =>
      prev.map((div, dIdx) => {
        if (dIdx !== activeDivisionIndex) return div;
        const updatedExercises = div.exercises.map((ex, eIdx) =>
          eIdx === exerciseIndex ? { ...ex, [field]: value } : ex
        );
        return { ...div, exercises: updatedExercises };
      })
    );
  };

  const handleMoveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= currentDivision.exercises.length) return;
    setDivisions((prev) =>
      prev.map((div, dIdx) => {
        if (dIdx !== activeDivisionIndex) return div;
        const reordered = [...div.exercises];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);
        // Reatribui a ordem
        const updated = reordered.map((item, idx) => ({ ...item, order: idx + 1 }));
        return { ...div, exercises: updated };
      })
    );
  };

  const handleRemoveExercise = (exerciseIndex: number) => {
    setDivisions((prev) =>
      prev.map((div, dIdx) => {
        if (dIdx !== activeDivisionIndex) return div;
        const filtered = div.exercises.filter((_, idx) => idx !== exerciseIndex);
        const reindexed = filtered.map((item, idx) => ({ ...item, order: idx + 1 }));
        return { ...div, exercises: reindexed };
      })
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Informe o nome da ficha de treino (ex: Ficha ABC Hipertrofia).');
      return;
    }

    if (divisions.length === 0) {
      setErrorMsg('Adicione pelo menos uma divisão de treino.');
      return;
    }

    const hasEmptyDivision = divisions.some((d) => d.exercises.length === 0);
    if (hasEmptyDivision) {
      setErrorMsg('Todas as divisões devem conter pelo menos um exercício cadastrado.');
      return;
    }

    const planId = planToEdit?.id || `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const planPayload: WorkoutPlanItem = {
      id: planId,
      name: name.trim(),
      version: version || 1,
      isActive,
      startDate: startDate || nowIso.split('T')[0],
      reviewDate: reviewDate.trim() ? reviewDate.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
      instructorNotes: instructorNotes.trim() ? instructorNotes.trim() : undefined,
      divisions,
      createdAt: planToEdit?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    try {
      await savePlan(planPayload);
      onClose();
    } catch (e) {
      console.error('Erro ao salvar ficha:', e);
      setErrorMsg('Falha ao salvar a ficha de treino no banco de dados.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {planToEdit ? 'Editar Ficha de Treino' : 'Nova Ficha de Treino'}
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre a prescrição do seu instrutor e organize suas divisões
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Section 1: Dados Gerais da Ficha */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4" /> Informações da Ficha
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-400">Nome da Ficha *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Treino ABC - Hipertrofia (Prof. Carlos)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Versão</label>
                <input
                  type="number"
                  min="1"
                  value={version}
                  onChange={(e) => setVersion(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Data Prevista para Revisão (Opcional)
                </label>
                <input
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Orientações do Instrutor (Opcional)</label>
                <textarea
                  value={instructorNotes}
                  onChange={(e) => setInstructorNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Foco em cadência lenta na fase excêntrica. Manter descanso estrito de 60s."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Anotações Gerais do Aluno (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ex: Ficha passada pelo instrutor na terça-feira após avaliação física."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-1 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-orange-500 bg-slate-800"
                />
                <span className="text-xs text-slate-200 font-medium">
                  Definir como Ficha Ativa no aplicativo (rotina principal de treino)
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Gestão de Divisões */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Divisões da Ficha ({divisions.length})
              </h3>
              <button
                type="button"
                onClick={handleAddDivision}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-orange-400" /> Adicionar Divisão
              </button>
            </div>

            {/* Division Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {divisions.map((div, idx) => {
                const isSelected = idx === activeDivisionIndex;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => setActiveDivisionIndex(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-400 shadow-md'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    <span>{div.name || `Divisão ${idx + 1}`}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-normal ${
                        isSelected ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {div.exercises.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Division Configuration */}
            {currentDivision && (
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Identificação da Divisão</label>
                      <input
                        type="text"
                        value={currentDivision.name}
                        onChange={(e) => handleUpdateDivisionMeta('name', e.target.value)}
                        placeholder="Ex: Treino A"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Foco Muscular / Descrição</label>
                      <input
                        type="text"
                        value={currentDivision.muscleFocus}
                        onChange={(e) => handleUpdateDivisionMeta('muscleFocus', e.target.value)}
                        placeholder="Ex: Peito, Ombros e Tríceps"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {divisions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDivision(activeDivisionIndex)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 p-2 rounded-lg hover:bg-red-500/10 self-end transition-colors"
                      title="Excluir esta divisão"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir divisão
                    </button>
                  )}
                </div>

                {/* Exercises in Active Division */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-slate-300">
                      Exercícios Prescritos ({currentDivision.exercises.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsExerciseSelectorOpen(true)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Exercício
                    </button>
                  </div>

                  {currentDivision.exercises.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 space-y-2">
                      <Dumbbell className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs">
                        Nenhum exercício cadastrado nesta divisão ainda.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsExerciseSelectorOpen(true)}
                        className="text-xs font-medium text-orange-400 hover:underline"
                      >
                        Abrir catálogo oficial de 48 exercícios
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {currentDivision.exercises.map((planEx, exIdx) => {
                        const catalogEx = getExerciseById(planEx.exerciseId);
                        const exerciseName = catalogEx ? catalogEx.name : planEx.exerciseId;
                        const muscleGroup = catalogEx?.primaryMuscleGroup || 'peito';

                        return (
                          <div
                            key={planEx.id || exIdx}
                            className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                          >
                            {/* Exercise header row */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                  {exIdx + 1}
                                </span>
                                <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                  <ExerciseIllustration
                                    exerciseId={planEx.exerciseId}
                                    exerciseName={exerciseName}
                                    muscleGroup={muscleGroup}
                                    size="sm"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-xs font-semibold text-white truncate">
                                    {exerciseName}
                                  </h5>
                                  <span className="text-[10px] text-slate-400">
                                    {MUSCLE_GROUP_LABELS[muscleGroup]}
                                  </span>
                                </div>
                              </div>

                              {/* Reorder and delete actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={exIdx === 0}
                                  onClick={() => handleMoveExercise(exIdx, exIdx - 1)}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
                                  title="Mover para cima"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={exIdx === currentDivision.exercises.length - 1}
                                  onClick={() => handleMoveExercise(exIdx, exIdx + 1)}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition-colors"
                                  title="Mover para baixo"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExercise(exIdx)}
                                  className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors ml-1"
                                  title="Remover exercício"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Prescription parameters row */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                              <div>
                                <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <Repeat className="w-3 h-3 text-orange-400" /> Séries
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={planEx.prescribedSets}
                                  onChange={(e) =>
                                    handleUpdateExercise(
                                      exIdx,
                                      'prescribedSets',
                                      parseInt(e.target.value, 10) || 1
                                    )
                                  }
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <ChevronRight className="w-3 h-3 text-orange-400" /> Repetições
                                </label>
                                <input
                                  type="text"
                                  value={planEx.prescribedReps}
                                  onChange={(e) =>
                                    handleUpdateExercise(exIdx, 'prescribedReps', e.target.value)
                                  }
                                  placeholder="Ex: 10-12, 12, Falha"
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <Weight className="w-3 h-3 text-orange-400" /> Carga Alvo (kg)
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  value={planEx.prescribedWeightKg ?? ''}
                                  onChange={(e) =>
                                    handleUpdateExercise(
                                      exIdx,
                                      'prescribedWeightKg',
                                      e.target.value === '' ? undefined : parseFloat(e.target.value)
                                    )
                                  }
                                  placeholder="Opcional"
                                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-400 flex items-center gap-1 mb-1">
                                  <Clock className="w-3 h-3 text-orange-400" /> Descanso (seg)
                                </label>
                                <select
                                  value={planEx.restIntervalSeconds}
                                  onChange={(e) =>
                                    handleUpdateExercise(
                                      exIdx,
                                      'restIntervalSeconds',
                                      parseInt(e.target.value, 10) || 60
                                    )
                                  }
                                  className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-white"
                                >
                                  <option value={30}>30s</option>
                                  <option value={45}>45s</option>
                                  <option value={60}>60s</option>
                                  <option value={90}>90s</option>
                                  <option value={120}>120s (2 min)</option>
                                  <option value={180}>180s (3 min)</option>
                                </select>
                              </div>
                            </div>

                            {/* Optional exercise notes */}
                            <div>
                              <input
                                type="text"
                                value={planEx.instructorNotes || ''}
                                onChange={(e) =>
                                  handleUpdateExercise(exIdx, 'instructorNotes', e.target.value)
                                }
                                placeholder="Anotações para este exercício (ex: Drop-set na última série, pausa de 2s...)"
                                className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
          >
            <Check className="w-4 h-4" /> Salvar Ficha de Treino
          </button>
        </div>
      </div>

      {/* Exercise Selector Modal */}
      <ExerciseSelectorModal
        isOpen={isExerciseSelectorOpen}
        onClose={() => setIsExerciseSelectorOpen(false)}
        onSelectExercise={handleAddExerciseToCurrentDivision}
        existingExerciseIds={currentDivision?.exercises.map((e) => e.exerciseId) || []}
      />
    </div>
  );
}
