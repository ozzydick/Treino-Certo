/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  Check,
  Dumbbell,
  Filter,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  MUSCLE_GROUP_LABELS,
  ORDERED_MUSCLE_GROUPS,
  filterExercisesCatalog,
  isExerciseCompatibleWithGym,
} from '../../constants/exercisesCatalog';
import { useEquipments } from '../../context/EquipmentsContext';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import { ExerciseItem, MuscleGroupId } from '../../types';
import { ExerciseIllustration } from '../exercises/ExerciseIllustration';
import { CustomExerciseModal } from '../exercises/CustomExerciseModal';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: ExerciseItem) => void;
  existingExerciseIds?: string[];
}

export function ExerciseSelectorModal({
  isOpen,
  onClose,
  onSelectExercise,
  existingExerciseIds = [],
}: ExerciseSelectorModalProps) {
  const { selectedIds, customEquipments, explicitCustomCompatibilityMap } = useEquipments();
  const { allExercises } = useCustomExercises();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroupId | 'all'>('all');
  const [onlyAvailableInGym, setOnlyAvailableInGym] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  const filteredExercises = useMemo(() => {
    return filterExercisesCatalog(allExercises, {
      muscleGroup: selectedMuscleGroup,
      searchQuery,
      onlyAvailableInGym,
      selectedEquipmentIds: selectedIds,
      customEquipments,
      explicitCustomCompatibilityMap,
    });
  }, [
    allExercises,
    searchQuery,
    selectedMuscleGroup,
    onlyAvailableInGym,
    selectedIds,
    explicitCustomCompatibilityMap,
    customEquipments,
  ]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Selecionar Exercício para Ficha</h2>
                <p className="text-xs text-slate-400">
                  Escolha no catálogo ou crie um exercício personalizado para a rotina
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-purple-300" />
                <span>Criar Exercício</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do exercício (ex: Supino, Agachamento, Puxada)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Muscle Group Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedMuscleGroup('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedMuscleGroup === 'all'
                    ? 'bg-orange-500 text-white font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos ({allExercises.length})
              </button>
              {ORDERED_MUSCLE_GROUPS.map((group) => {
                const isSelected = selectedMuscleGroup === group;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setSelectedMuscleGroup(group)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-orange-500 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {MUSCLE_GROUP_LABELS[group]}
                  </button>
                );
              })}
            </div>

            {/* Gym Availability Toggle */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">
                Mostrando <strong className="text-white">{filteredExercises.length}</strong> de {allExercises.length} exercícios
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailableInGym}
                  onChange={(e) => setOnlyAvailableInGym(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-orange-500 focus:ring-0 bg-slate-800 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-orange-400" /> Apenas disponíveis na minha academia
                </span>
              </label>
            </div>
          </div>

          {/* Exercises List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <p className="text-sm">Nenhum exercício encontrado com os filtros selecionados.</p>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedMuscleGroup('all');
                      setOnlyAvailableInGym(false);
                    }}
                    className="text-xs text-orange-400 hover:underline"
                  >
                    Limpar filtros
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => setIsCustomModalOpen(true)}
                    className="text-xs text-purple-400 font-bold hover:underline"
                  >
                    + Criar Novo Exercício
                  </button>
                </div>
              </div>
            ) : (
              filteredExercises.map((exercise) => {
                const isAlreadyInDivision = existingExerciseIds.includes(exercise.id);
                const isCompatible = isExerciseCompatibleWithGym(
                  exercise,
                  selectedIds,
                  explicitCustomCompatibilityMap,
                  customEquipments
                );

                return (
                  <div
                    key={exercise.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isAlreadyInDivision
                        ? 'bg-slate-800/40 border-slate-800/60 opacity-80'
                        : 'bg-slate-800/70 border-slate-700/60 hover:border-orange-500/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Thumbnail 3D or Photo */}
                      <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-700/60 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <ExerciseIllustration
                          exerciseId={exercise.id}
                          exerciseName={exercise.name}
                          muscleGroup={exercise.primaryMuscleGroup}
                          photoUrl={exercise.externalVideoUrl?.startsWith('data:image/') ? exercise.externalVideoUrl : undefined}
                          size="sm"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {exercise.name}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                            {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup]}
                          </span>
                          {exercise.isCustom && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                              Personalizado
                            </span>
                          )}
                          {isCompatible ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Disponível
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              Sem equipamento
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {exercise.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="ml-3 flex-shrink-0">
                      {isAlreadyInDivision ? (
                        <span className="flex items-center gap-1 text-xs text-slate-500 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Adicionado
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectExercise(exercise);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="text-xs font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Criar Novo Exercício</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSaved={(newEx) => {
          onSelectExercise(newEx);
          onClose();
        }}
      />
    </>
  );
}
