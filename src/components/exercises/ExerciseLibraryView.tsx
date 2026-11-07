/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useEquipments } from '../../context/EquipmentsContext';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import {
  ExerciseItem,
  MUSCLE_GROUP_LABELS,
  MuscleGroupId,
} from '../../types';
import {
  ORDERED_MUSCLE_GROUPS,
  filterExercisesCatalog,
  formatEquipmentAlternativesSummary,
  getExerciseCountByMuscleGroup,
  isExerciseCompatibleWithGym,
  isExternalVideoVerifiedAndValid,
} from '../../constants/exercisesCatalog';
import { ExerciseIllustration } from './ExerciseIllustration';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { CustomExerciseModal } from './CustomExerciseModal';

interface ExerciseLibraryViewProps {
  onOpenEquipments?: () => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
  onOpenEquipments,
}) => {
  const { themeConfig } = useTheme();
  const { profile } = useUser();
  const {
    selectedIds,
    totalSelectedCount,
    customEquipments,
    explicitCustomCompatibilityMap,
    linkCustomEquipmentToExercise,
    unlinkCustomEquipmentFromExercise,
  } = useEquipments();
  const { allExercises, customExercises } = useCustomExercises();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'all' | MuscleGroupId>('all');
  const [onlyAvailableInGym, setOnlyAvailableInGym] = useState(false);
  const [onlyCustom, setOnlyCustom] = useState(false);
  
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<ExerciseItem | null>(null);

  const countsByGroup = useMemo(
    () => getExerciseCountByMuscleGroup(allExercises),
    [allExercises]
  );

  const filteredExercises = useMemo(() => {
    let list = filterExercisesCatalog(allExercises, {
      searchQuery,
      muscleGroup: selectedMuscleGroup,
      onlyAvailableInGym,
      selectedEquipmentIds: selectedIds,
      customEquipments,
      explicitCustomCompatibilityMap,
    });

    if (onlyCustom) {
      list = list.filter((ex) => Boolean(ex.isCustom));
    }

    return list;
  }, [
    allExercises,
    searchQuery,
    selectedMuscleGroup,
    onlyAvailableInGym,
    onlyCustom,
    selectedIds,
    customEquipments,
    explicitCustomCompatibilityMap,
  ]);

  const compatibleInCatalogCount = useMemo(
    () =>
      allExercises.filter((ex) =>
        isExerciseCompatibleWithGym(
          ex,
          selectedIds,
          explicitCustomCompatibilityMap,
          customEquipments
        )
      ).length,
    [allExercises, selectedIds, explicitCustomCompatibilityMap, customEquipments]
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-28 space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Consulta Técnica Offline</span>
              <span aria-hidden="true">·</span>
              <span>{allExercises.length} exercícios ({customExercises.length} personalizados)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <BookOpen className="w-7 h-7 shrink-0" style={{ color: themeConfig.primaryHex }} />
              <span>Biblioteca de Exercícios</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Instruções biomecânicas passo a passo e cadastro de exercícios personalizados.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setExerciseToEdit(null);
                setIsCustomModalOpen(true);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-black transition flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: themeConfig.primaryHex }}
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span>Novo Exercício</span>
            </button>

            {onOpenEquipments && (
              <button
                type="button"
                onClick={onOpenEquipments}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-card border border-white/10 hover:border-white/25 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-2 whitespace-nowrap"
              >
                <Dumbbell className="w-4 h-4" style={{ color: themeConfig.primaryHex }} />
                <span>
                  Academia ({totalSelectedCount})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Gym Compatibility & Custom Filter Bar */}
        <div className="p-3.5 rounded-2xl bg-surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-white tabular-nums">{compatibleInCatalogCount}</strong> de{' '}
              <strong className="text-white tabular-nums">{allExercises.length}</strong> exercícios disponíveis{' '}
              {totalSelectedCount > 0 ? (
                <>
                  em{' '}
                  {profile.gymName && profile.gymName.trim()
                    ? profile.gymName
                    : 'sua academia'}
                </>
              ) : (
                '(apenas livres no solo)'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {customExercises.length > 0 && (
              <button
                type="button"
                onClick={() => setOnlyCustom((prev) => !prev)}
                aria-pressed={onlyCustom}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 border ${
                  onlyCustom
                    ? 'bg-purple-500/30 border-purple-500/50 text-purple-200 font-bold'
                    : 'bg-surface-elevated border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Meus Exercícios ({customExercises.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setOnlyAvailableInGym((prev) => !prev)}
              aria-pressed={onlyAvailableInGym}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border ${
                onlyAvailableInGym
                  ? 'text-black border-transparent font-bold'
                  : 'bg-surface-elevated border-white/10 text-slate-300 hover:text-white'
              }`}
              style={
                onlyAvailableInGym ? { backgroundColor: themeConfig.primaryHex } : undefined
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {onlyAvailableInGym ? 'Filtrando: Academia' : 'Minha Academia'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar exercício pelo nome (ex: supino, agachamento, rosca...)"
          aria-label="Pesquisar pelo nome do exercício"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 transition"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg"
            aria-label="Limpar pesquisa de exercício"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Muscle Group Filter Buttons (11 Official Muscle Groups) */}
      <div
        role="tablist"
        aria-label="Filtrar exercícios por grupo muscular"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={selectedMuscleGroup === 'all'}
          onClick={() => setSelectedMuscleGroup('all')}
          className={`min-h-[38px] shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedMuscleGroup === 'all'
              ? 'text-black font-bold'
              : 'text-slate-300 hover:text-white bg-surface-card border border-white/5'
          }`}
          style={
            selectedMuscleGroup === 'all'
              ? { backgroundColor: themeConfig.primaryHex }
              : undefined
          }
        >
          Todos ({allExercises.length})
        </button>

        {ORDERED_MUSCLE_GROUPS.map((groupKey) => {
          const isSelected = selectedMuscleGroup === groupKey;
          const count = countsByGroup[groupKey] || 0;

          return (
            <button
              key={groupKey}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedMuscleGroup(groupKey)}
              className={`min-h-[38px] shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                isSelected
                  ? 'text-black font-bold'
                  : 'text-slate-300 hover:text-white bg-surface-card border border-white/5'
              }`}
              style={
                isSelected ? { backgroundColor: themeConfig.primaryHex } : undefined
              }
            >
              {MUSCLE_GROUP_LABELS[groupKey]} ({count})
            </button>
          );
        })}
      </div>

      {/* Exercises List */}
      {filteredExercises.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-surface-card border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-elevated mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Nenhum exercício encontrado para os filtros atuais
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Tente buscar por outro termo, limpar o filtro de busca ou criar um novo exercício personalizado.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedMuscleGroup('all');
                setOnlyAvailableInGym(false);
                setOnlyCustom(false);
              }}
              className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-200 hover:text-white"
            >
              Limpar filtros
            </button>

            <button
              type="button"
              onClick={() => {
                setExerciseToEdit(null);
                setIsCustomModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-black"
              style={{ backgroundColor: themeConfig.primaryHex }}
            >
              + Criar Novo Exercício
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredExercises.map((exercise) => {
            const primaryLabel =
              MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] ||
              exercise.primaryMuscleGroup;
            const equipmentNamesSummary = formatEquipmentAlternativesSummary(
              exercise,
              customEquipments,
              selectedIds,
              explicitCustomCompatibilityMap
            );

            const availableInGym = isExerciseCompatibleWithGym(
              exercise,
              selectedIds,
              explicitCustomCompatibilityMap,
              customEquipments
            );
            const hasValidatedVideo = isExternalVideoVerifiedAndValid(exercise);

            return (
              <button
                key={exercise.id}
                type="button"
                onClick={() => setSelectedExercise(exercise)}
                className="w-full text-left p-3.5 rounded-2xl bg-surface-card border border-white/5 hover:border-white/20 transition flex items-center justify-between gap-3.5 group relative overflow-hidden"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Miniatura Demonstrativa */}
                  <div className="w-16 h-16 sm:w-18 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-surface-dark">
                    <ExerciseIllustration
                      exerciseId={exercise.id}
                      name={exercise.name}
                      muscleGroup={exercise.primaryMuscleGroup}
                      photoUrl={exercise.externalVideoUrl?.startsWith('data:image/') ? exercise.externalVideoUrl : undefined}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Dados Principais: Nome, Grupo Muscular, Personalizado e Equipamento */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                      <span
                        className="font-semibold"
                        style={{ color: themeConfig.primaryHex }}
                      >
                        {primaryLabel}
                      </span>

                      {exercise.isCustom && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          Personalizado
                        </span>
                      )}

                      {availableInGym && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-emerald-400 font-medium">
                            Na sua academia
                          </span>
                        </>
                      )}

                      {hasValidatedVideo && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400 inline-flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" />
                            <span>Vídeo</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:underline">
                      {exercise.name}
                    </h3>

                    <p className="text-xs text-slate-400 truncate">
                      <span className="text-slate-500">Equipamento: </span>
                      <span className="text-slate-300">{equipmentNamesSummary}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-slate-400 group-hover:text-white transition p-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes Completos do Exercício */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        isOpen={Boolean(selectedExercise)}
        onClose={() => setSelectedExercise(null)}
        customEquipments={customEquipments}
        selectedEquipmentIds={selectedIds}
        explicitCustomCompatibilityMap={explicitCustomCompatibilityMap}
        onLinkCustomEquipment={linkCustomEquipmentToExercise}
        onUnlinkCustomEquipment={unlinkCustomEquipmentFromExercise}
        onOpenEquipments={onOpenEquipments}
        onEditCustomExercise={(exToEdit) => {
          setExerciseToEdit(exToEdit);
          setIsCustomModalOpen(true);
        }}
      />

      {/* Modal de Criar / Editar Exercício Personalizado */}
      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setExerciseToEdit(null);
        }}
        exerciseToEdit={exerciseToEdit}
      />
    </div>
  );
};
