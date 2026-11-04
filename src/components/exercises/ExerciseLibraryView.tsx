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
  Search,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useEquipments } from '../../context/EquipmentsContext';
import {
  ExerciseItem,
  MUSCLE_GROUP_LABELS,
  MuscleGroupId,
} from '../../types';
import {
  DEFAULT_EXERCISES_CATALOG,
  ORDERED_MUSCLE_GROUPS,
  filterExercisesCatalog,
  formatEquipmentAlternativesSummary,
  getExerciseCountByMuscleGroup,
  isExerciseCompatibleWithGym,
  isExternalVideoVerifiedAndValid,
} from '../../constants/exercisesCatalog';
import { ExerciseIllustration } from './ExerciseIllustration';
import { ExerciseDetailModal } from './ExerciseDetailModal';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<'all' | MuscleGroupId>('all');
  const [onlyAvailableInGym, setOnlyAvailableInGym] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(null);

  const countsByGroup = useMemo(
    () => getExerciseCountByMuscleGroup(DEFAULT_EXERCISES_CATALOG),
    []
  );

  const filteredExercises = useMemo(
    () =>
      filterExercisesCatalog(DEFAULT_EXERCISES_CATALOG, {
        searchQuery,
        muscleGroup: selectedMuscleGroup,
        onlyAvailableInGym,
        selectedEquipmentIds: selectedIds,
        customEquipments,
        explicitCustomCompatibilityMap,
      }),
    [
      searchQuery,
      selectedMuscleGroup,
      onlyAvailableInGym,
      selectedIds,
      customEquipments,
      explicitCustomCompatibilityMap,
    ]
  );

  const compatibleInCatalogCount = useMemo(
    () =>
      DEFAULT_EXERCISES_CATALOG.filter((ex) =>
        isExerciseCompatibleWithGym(
          ex,
          selectedIds,
          explicitCustomCompatibilityMap,
          customEquipments
        )
      ).length,
    [selectedIds, explicitCustomCompatibilityMap, customEquipments]
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
              <span>{DEFAULT_EXERCISES_CATALOG.length} exercícios catalogados</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
              <BookOpen className="w-7 h-7 shrink-0" style={{ color: themeConfig.primaryHex }} />
              <span>Biblioteca de Exercícios</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Instruções biomecânicas passo a passo e compatibilidade com os equipamentos da sua academia para apoiar a ficha do seu instrutor.
            </p>
          </div>

          {onOpenEquipments && (
            <button
              type="button"
              onClick={onOpenEquipments}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-surface-card border border-white/10 hover:border-white/25 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center gap-2 shrink-0 self-start sm:self-auto whitespace-nowrap"
            >
              <Dumbbell className="w-4 h-4" style={{ color: themeConfig.primaryHex }} />
              <span>
                Minha Academia ({totalSelectedCount})
              </span>
            </button>
          )}
        </div>

        {/* Gym Compatibility Filter Bar */}
        <div className="p-3.5 rounded-2xl bg-surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              <strong className="text-white tabular-nums">{compatibleInCatalogCount}</strong> de{' '}
              <strong className="text-white tabular-nums">
                {DEFAULT_EXERCISES_CATALOG.length}
              </strong>{' '}
              exercícios disponíveis{' '}
              {totalSelectedCount > 0 ? (
                <>
                  em{' '}
                  {profile.gymName && profile.gymName.trim()
                    ? profile.gymName
                    : 'sua academia conforme os equipamentos selecionados'}
                </>
              ) : (
                '(apenas livres no solo — selecione os aparelhos da sua academia para ampliar)'
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOnlyAvailableInGym((prev) => !prev)}
            aria-pressed={onlyAvailableInGym}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 border ${
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
              {onlyAvailableInGym ? 'Filtrando: Minha Academia' : 'Filtrar por Minha Academia'}
            </span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar exercício pelo nome (ex: supino, agachamento, puxada, prancha...)"
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
          Todos ({DEFAULT_EXERCISES_CATALOG.length})
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
              {onlyAvailableInGym && totalSelectedCount === 0
                ? 'Você ativou o filtro da sua academia sem equipamentos selecionados, exibindo apenas exercícios livres de solo.'
                : 'Tente buscar por outro termo ou alterar o filtro de grupo muscular.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-200 hover:text-white"
              >
                Limpar pesquisa
              </button>
            )}
            {selectedMuscleGroup !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedMuscleGroup('all')}
                className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-200 hover:text-white"
              >
                Mostrar todos os grupos
              </button>
            )}
            {onlyAvailableInGym && (
              <button
                type="button"
                onClick={() => setOnlyAvailableInGym(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-black"
                style={{ backgroundColor: themeConfig.primaryHex }}
              >
                Remover filtro da academia
              </button>
            )}
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
                className="w-full text-left p-3.5 rounded-2xl bg-surface-card border border-white/5 hover:border-white/20 transition flex items-center justify-between gap-3.5 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Miniatura Demonstrativa */}
                  <div className="w-16 h-16 sm:w-18 sm:h-16 shrink-0 rounded-xl overflow-hidden bg-surface-dark">
                    <ExerciseIllustration
                      exerciseId={exercise.id}
                      name={exercise.name}
                      muscleGroup={exercise.primaryMuscleGroup}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Dados Principais: Nome, Grupo Muscular e Equipamento Compatível */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span
                        className="font-semibold"
                        style={{ color: themeConfig.primaryHex }}
                      >
                        {primaryLabel}
                      </span>
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
      />
    </div>
  );
};
