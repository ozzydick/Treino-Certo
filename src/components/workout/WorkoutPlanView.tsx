/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Dumbbell,
  Edit3,
  History,
  Layers,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Sparkles,
  Trash2,
  Weight,
} from 'lucide-react';
import {
  DEFAULT_EXERCISES_CATALOG,
  MUSCLE_GROUP_LABELS,
  formatEquipmentAlternativesSummary,
  isExerciseCompatibleWithGym,
} from '../../constants/exercisesCatalog';
import { useEquipments } from '../../context/EquipmentsContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import { ExerciseItem, NavigationTab, WorkoutDivision, WorkoutPlanItem } from '../../types';
import { ExerciseDetailModal } from '../exercises/ExerciseDetailModal';
import { ExerciseIllustration } from '../exercises/ExerciseIllustration';
import { WorkoutExecutionView } from './WorkoutExecutionView';
import { WorkoutHistoryView } from './WorkoutHistoryView';
import { WorkoutPlanEditorModal } from './WorkoutPlanEditorModal';

interface WorkoutPlanViewProps {
  onOpenEquipments?: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export function WorkoutPlanView({ onOpenEquipments }: WorkoutPlanViewProps) {
  const {
    workoutPlans,
    activePlan,
    activeSession,
    savePlan,
    deletePlan,
    setActivePlanId,
    startSession,
    discardActiveSession,
  } = useWorkout();

  const { selectedIds, customEquipments, explicitCustomCompatibilityMap } = useEquipments();
  const { getExerciseById } = useCustomExercises();

  const [currentView, setCurrentView] = useState<'main' | 'history' | 'executing'>('main');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeDivisionIndex, setActiveDivisionIndex] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<WorkoutPlanItem | null>(null);
  const [detailModalExercise, setDetailModalExercise] = useState<ExerciseItem | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Ficha atualmente em visualização
  const displayedPlan = useMemo(() => {
    if (selectedPlanId) {
      const found = workoutPlans.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return activePlan || workoutPlans[0] || null;
  }, [selectedPlanId, workoutPlans, activePlan]);

  const currentDivision: WorkoutDivision | null = useMemo(() => {
    if (!displayedPlan || !displayedPlan.divisions || displayedPlan.divisions.length === 0) {
      return null;
    }
    return displayedPlan.divisions[activeDivisionIndex] || displayedPlan.divisions[0];
  }, [displayedPlan, activeDivisionIndex]);

  // Se houver treino ativo e o usuário clicar em executar
  if (currentView === 'executing' && activeSession) {
    return (
      <WorkoutExecutionView
        onMinimize={() => setCurrentView('main')}
        onFinish={() => setCurrentView('history')}
      />
    );
  }

  // Se o usuário navegou para o histórico
  if (currentView === 'history') {
    return <WorkoutHistoryView onBack={() => setCurrentView('main')} />;
  }

  const handleStartWorkout = async (division: WorkoutDivision) => {
    if (!displayedPlan) return;
    try {
      await startSession(displayedPlan.id, division.id);
      setCurrentView('executing');
    } catch (e) {
      console.error('Falha ao iniciar treino:', e);
    }
  };

  const handleCreateNewPlan = () => {
    setPlanToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditCurrentPlan = () => {
    if (displayedPlan) {
      setPlanToEdit(displayedPlan);
      setIsEditorOpen(true);
    }
  };

  const handleDeleteCurrentPlan = async (id: string) => {
    await deletePlan(id);
    setPlanToDelete(null);
    setSelectedPlanId(null);
  };

  // Carrega exemplo tradicional de prescrição ABC se o usuário não possuir nenhuma ficha
  const handleLoadSamplePlan = async () => {
    const nowIso = new Date().toISOString();
    const samplePlan: WorkoutPlanItem = {
      id: `plan_sample_abc_${Date.now()}`,
      name: 'Ficha ABC — Prescrição Tradicional',
      version: 1,
      isActive: true,
      startDate: nowIso.split('T')[0],
      reviewDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      instructorNotes:
        'Aquecimento de 5 a 10 minutos. Cadência controlada 2-0-2. Descanso estrito de 60 segundos entre séries.',
      notes: 'Ficha padrão para adaptação e hipertrofia progressiva.',
      divisions: [
        {
          id: `div_sample_a`,
          name: 'Treino A',
          muscleFocus: 'Peito, Ombros e Tríceps',
          exercises: [
            {
              id: 'ex_sample_1',
              exerciseId: 'ex_peito_supino_reto_barra',
              order: 1,
              prescribedSets: 4,
              prescribedReps: '10-12',
              prescribedWeightKg: 20,
              restIntervalSeconds: 60,
              instructorNotes: 'Escápulas aduzidas e pés firmes no solo.',
            },
            {
              id: 'ex_sample_2',
              exerciseId: 'ex_peito_supino_inclinado_halteres',
              order: 2,
              prescribedSets: 3,
              prescribedReps: '10-12',
              prescribedWeightKg: 16,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_3',
              exerciseId: 'ex_ombros_desenvolvimento_halteres',
              order: 3,
              prescribedSets: 3,
              prescribedReps: '10-12',
              prescribedWeightKg: 12,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_4',
              exerciseId: 'ex_ombros_elevacao_lateral_halteres',
              order: 4,
              prescribedSets: 4,
              prescribedReps: '12-15',
              prescribedWeightKg: 8,
              restIntervalSeconds: 45,
            },
            {
              id: 'ex_sample_5',
              exerciseId: 'ex_triceps_pulley_barra',
              order: 5,
              prescribedSets: 3,
              prescribedReps: '12-15',
              prescribedWeightKg: 25,
              restIntervalSeconds: 45,
            },
          ],
        },
        {
          id: `div_sample_b`,
          name: 'Treino B',
          muscleFocus: 'Costas e Bíceps',
          exercises: [
            {
              id: 'ex_sample_6',
              exerciseId: 'ex_costas_puxada_alta_frontal',
              order: 1,
              prescribedSets: 4,
              prescribedReps: '10-12',
              prescribedWeightKg: 40,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_7',
              exerciseId: 'ex_costas_remada_baixa_triangulo',
              order: 2,
              prescribedSets: 4,
              prescribedReps: '10-12',
              prescribedWeightKg: 35,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_8',
              exerciseId: 'ex_biceps_rosca_direta_barra',
              order: 3,
              prescribedSets: 3,
              prescribedReps: '10-12',
              prescribedWeightKg: 14,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_9',
              exerciseId: 'ex_biceps_rosca_alternada_halteres',
              order: 4,
              prescribedSets: 3,
              prescribedReps: '10-12',
              prescribedWeightKg: 10,
              restIntervalSeconds: 60,
            },
          ],
        },
        {
          id: `div_sample_c`,
          name: 'Treino C',
          muscleFocus: 'Pernas, Panturrilhas e Abdômen',
          exercises: [
            {
              id: 'ex_sample_10',
              exerciseId: 'ex_quadriceps_leg_press_45',
              order: 1,
              prescribedSets: 4,
              prescribedReps: '10-12',
              prescribedWeightKg: 120,
              restIntervalSeconds: 90,
            },
            {
              id: 'ex_sample_11',
              exerciseId: 'ex_quadriceps_cadeira_extensora',
              order: 2,
              prescribedSets: 3,
              prescribedReps: '12-15',
              prescribedWeightKg: 40,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_12',
              exerciseId: 'ex_posterior_mesa_flexora',
              order: 3,
              prescribedSets: 4,
              prescribedReps: '10-12',
              prescribedWeightKg: 35,
              restIntervalSeconds: 60,
            },
            {
              id: 'ex_sample_13',
              exerciseId: 'ex_panturrilhas_sentado_maquina',
              order: 4,
              prescribedSets: 4,
              prescribedReps: '15-20',
              prescribedWeightKg: 30,
              restIntervalSeconds: 45,
            },
            {
              id: 'ex_sample_14',
              exerciseId: 'ex_abdomen_supra_solo',
              order: 5,
              prescribedSets: 3,
              prescribedReps: '20',
              restIntervalSeconds: 45,
            },
          ],
        },
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await savePlan(samplePlan);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn pb-24">
      {/* Banner de Treino em Andamento (Resiliência a recargas) */}
      {activeSession && !activeSession.isCompleted && (
        <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/10 border-2 border-orange-500/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center animate-pulse flex-shrink-0">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-white">
                  Em Andamento
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {activeSession.divisionName}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Iniciado às {new Date(activeSession.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {activeSession.exercisesCompleted} exercícios registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => discardActiveSession()}
              className="px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={() => setCurrentView('executing')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Retomar Treino Agora
            </button>
          </div>
        </div>
      )}

      {/* Header Principal da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Minha Ficha de Treino</h1>
            <p className="text-xs text-slate-400">
              Cadastre e execute a prescrição do seu instrutor com registro de cargas reais
            </p>
          </div>
        </div>

        {/* Ações Superiores */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentView('history')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <History className="w-4 h-4 text-orange-400" />
            <span>Histórico de Treinos</span>
          </button>

          <button
            onClick={handleCreateNewPlan}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Ficha</span>
          </button>
        </div>
      </div>

      {/* Se não houver fichas cadastradas */}
      {!displayedPlan ? (
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">Nenhuma Ficha Cadastrada</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
              O Treino Certo não prescreve treinos aleatórios: o aplicativo é sua ferramenta oficial para organizar a prescrição passada pelo seu instrutor, consultar a biomecânica correta em 3D e registrar o aumento das suas cargas a cada série.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleCreateNewPlan}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all"
            >
              <Plus className="w-4 h-4" /> Cadastrar Minha Ficha Manualmente
            </button>

            <button
              onClick={handleLoadSamplePlan}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4 text-orange-400" /> Carregar Ficha Exemplo (ABC)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Seletor de Múltiplas Fichas (quando há mais de uma) */}
          {workoutPlans.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-xs text-slate-400 whitespace-nowrap mr-1">Suas Fichas:</span>
              {workoutPlans.map((plan) => {
                const isSelected = plan.id === displayedPlan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-sm'
                        : 'bg-slate-850 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span>{plan.name}</span>
                    {plan.isActive && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Ativa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Card de Informações da Ficha Selecionada */}
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {displayedPlan.name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                    v{displayedPlan.version}
                  </span>
                  {displayedPlan.isActive ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ficha Ativa
                    </span>
                  ) : (
                    <button
                      onClick={() => setActivePlanId(displayedPlan.id)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors"
                    >
                      Definir como Ficha Ativa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> Início: {displayedPlan.startDate}
                  </span>
                  {displayedPlan.reviewDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> Revisão:{' '}
                      {displayedPlan.reviewDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Botões de Ação da Ficha */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  onClick={handleEditCurrentPlan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Editar Ficha</span>
                </button>
                <button
                  onClick={() => setPlanToDelete(displayedPlan.id)}
                  className="p-2 text-slate-500 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                  title="Excluir Ficha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Orientações do Instrutor */}
            {displayedPlan.instructorNotes && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                  Prescrição e Recomendações do Instrutor:
                </span>
                <p className="leading-relaxed">{displayedPlan.instructorNotes}</p>
              </div>
            )}

            {/* Seletor de Divisões (Treino A, Treino B, Treino C...) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-orange-400" /> Divisões da Ficha
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {displayedPlan.divisions.map((division, idx) => {
                  const isSelected = idx === activeDivisionIndex;
                  return (
                    <button
                      key={division.id}
                      onClick={() => setActiveDivisionIndex(idx)}
                      className={`p-3.5 rounded-xl text-left transition-all border ${
                        isSelected
                          ? 'bg-orange-500/15 border-orange-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">{division.name}</span>
                        <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                          {division.exercises.length} exerc.
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {division.muscleFocus || 'Geral'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detalhes da Divisão Selecionada */}
          {currentDivision && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 font-black flex items-center justify-center text-xs">
                      {currentDivision.name.replace(/[^A-Za-z0-9]/g, '').slice(-1) || 'A'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {currentDivision.name} — {currentDivision.muscleFocus}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentDivision.exercises.length} exercícios prescritos pelo instrutor
                  </p>
                </div>

                {/* Botão de Destaque para Iniciar Treino */}
                <button
                  onClick={() => handleStartWorkout(currentDivision)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-orange-500/25 transition-all transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Treino {currentDivision.name}</span>
                </button>
              </div>

              {/* Lista de Exercícios da Divisão */}
              <div className="space-y-3">
                {currentDivision.exercises.map((planEx, exIdx) => {
                  const catalogEx = getExerciseById(planEx.exerciseId);
                  const exerciseName = catalogEx ? catalogEx.name : planEx.exerciseId;
                  const muscleGroup = catalogEx?.primaryMuscleGroup || 'peito';

                  const isCompatible = catalogEx
                    ? isExerciseCompatibleWithGym(
                        catalogEx,
                        selectedIds,
                        explicitCustomCompatibilityMap,
                        customEquipments
                      )
                    : true;

                  return (
                    <div
                      key={planEx.id || exIdx}
                      className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all shadow-md"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {exIdx + 1}
                        </span>

                        {/* Imagem 3D WebP Oficial */}
                        <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <ExerciseIllustration
                            exerciseId={planEx.exerciseId}
                            exerciseName={exerciseName}
                            muscleGroup={muscleGroup}
                            size="sm"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-white truncate">
                              {exerciseName}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                              {MUSCLE_GROUP_LABELS[muscleGroup]}
                            </span>
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

                          {/* Prescrição Detalhada */}
                          <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-white">
                              <Repeat className="w-3.5 h-3.5 text-orange-400" />
                              {planEx.prescribedSets} séries × {planEx.prescribedReps} reps
                            </span>
                            {planEx.prescribedWeightKg !== undefined && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Weight className="w-3.5 h-3.5 text-orange-400" />
                                {planEx.prescribedWeightKg} kg
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-500" />
                              {planEx.restIntervalSeconds}s descanso
                            </span>
                          </div>

                          {planEx.instructorNotes && (
                            <p className="text-[11px] text-orange-400/90 font-medium pt-0.5">
                              Instrutor: {planEx.instructorNotes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botão para Ver Técnica */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {catalogEx && (
                          <button
                            onClick={() => setDetailModalExercise(catalogEx)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-medium transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                            <span>Biomecânica</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Detalhes Biomecânicos do Exercício */}
      {detailModalExercise && (
        <ExerciseDetailModal
          exercise={detailModalExercise}
          onClose={() => setDetailModalExercise(null)}
          onOpenEquipments={onOpenEquipments}
        />
      )}

      {/* Modal de Criação / Edição de Ficha */}
      <WorkoutPlanEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        planToEdit={planToEdit}
      />

      {/* Modal de Confirmação de Exclusão de Ficha */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Excluir Ficha de Treino?</h3>
            <p className="text-xs text-slate-400">
              Tem certeza que deseja excluir esta ficha? Suas sessões executadas no histórico continuarão preservadas.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCurrentPlan(planToDelete)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
