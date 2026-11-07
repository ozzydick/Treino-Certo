/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeId = 'orange' | 'green' | 'blue' | 'purple' | 'red' | 'gold';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  label: string;
  primaryHex: string;
  complementaryHex: string;
  primaryDarkHex: string;
  rgb: string;
  description: string;
}

export type FitnessGoal =
  | 'hipertrofia'
  | 'emagrecimento'
  | 'condicionamento'
  | 'forca'
  | 'saude';

export interface UserProfile {
  id: string;
  name: string;
  birthDate?: string;
  height?: number; // in cm
  weight?: number; // in kg
  goal?: FitnessGoal;
  gymName?: string;
  weeklyFrequency?: number; // 1 to 7 days
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutGoalConfig {
  targetWorkoutsPerWeek: number; // 1 to 7
  preferredDays?: number[]; // 0 = Dom, 1 = Seg, 2 = Ter, 3 = Qua, 4 = Qui, 5 = Sex, 6 = Sáb
  startDate?: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface LocalReminderConfig {
  isActive: boolean;
  days: number[]; // 0 = Dom, 1 = Seg, ..., 6 = Sáb
  time: string; // "HH:MM" e.g. "08:00"
  message?: string;
  lastShownDate?: string; // YYYY-MM-DD
}

export interface UserPreferences {
  id: string;
  theme: ThemeId;
  soundAlerts: boolean;
  vibration: boolean;
  restTimerDefaultSeconds: number;
  keepScreenAwake: boolean;
  updatedAt: string;
  // CP06 additions: Metas e Lembretes Locais
  goalConfig?: WorkoutGoalConfig;
  reminderConfig?: LocalReminderConfig;
  customExercises?: ExerciseItem[];
}

export interface WeeklySummaryMetrics {
  weekStartDate: string;
  weekEndDate: string;
  completedWorkouts: number;
  targetWorkouts: number;
  compliancePercentage: number;
  activeDurationSeconds: number;
  totalVolumeKg: number;
  previousWeekCompletedWorkouts: number;
  previousWeekVolumeKg: number;
  previousWeekDurationSeconds: number;
  workoutsDelta: number;
  volumeDeltaKg: number;
  volumeDeltaPercent: number;
  durationDeltaSeconds: number;
  highlights: string[];
}

export type NavigationTab = 'home' | 'plan' | 'exercises' | 'evolution' | 'cardio' | 'profile';

export type EvolutionTimeRange = '7d' | '30d' | '90d' | '6m' | '12m' | 'all';

export interface BodyMeasurementItem {
  id: string;
  date: string; // ISO date string: YYYY-MM-DD or full ISO
  weightKg?: number;
  waistCm?: number;
  abdomenCm?: number;
  chestCm?: number;
  armRightCm?: number;
  armLeftCm?: number;
  thighRightCm?: number;
  thighLeftCm?: number;
  calfRightCm?: number;
  calfLeftCm?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'general'
  | 'cardio';

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  chest: 'Peito',
  back: 'Costas',
  legs: 'Pernas e glúteos',
  shoulders: 'Ombros',
  arms: 'Bíceps e tríceps',
  general: 'Equipamentos gerais',
  cardio: 'Cardio',
};

// Checkpoint 02 & 03: Catálogo de Equipamentos, Seleção da Academia e Vínculo Explícito com Exercícios
export interface GymEquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  isCustom?: boolean;
  isSelected?: boolean;
  /**
   * IDs de exercícios aos quais este equipamento personalizado foi explicitamente vinculado.
   * Quando ausente ou vazio, o equipamento personalizado não habilita exercícios automaticamente.
   */
  linkedExerciseIds?: string[];
  /**
   * Alternativas explícitas de execução por exercício (útil quando o equipamento personalizado
   * compõe uma alternativa combinada com outros equipamentos obrigatórios, ex.: rack personalizado + barra + anilhas).
   */
  linkedExerciseAlternatives?: Record<string, string[][]>;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

// Checkpoint 03: Biblioteca de Exercícios e Grupos Musculares Oficiais
export type MuscleGroupId =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'quadriceps'
  | 'posterior_coxa'
  | 'gluteos'
  | 'panturrilhas'
  | 'abdomen_core'
  | 'corpo_inteiro';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroupId, string> = {
  peito: 'Peito',
  costas: 'Costas',
  ombros: 'Ombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  quadriceps: 'Quadríceps',
  posterior_coxa: 'Posterior de coxa',
  gluteos: 'Glúteos',
  panturrilhas: 'Panturrilhas',
  abdomen_core: 'Abdômen e core',
  corpo_inteiro: 'Corpo inteiro',
};

export interface ExerciseItem {
  id: string;
  name: string;
  primaryMuscleGroup: MuscleGroupId;
  secondaryMuscleGroups: MuscleGroupId[];
  compatibleEquipmentIds: string[];
  /**
   * Representação explícita das alternativas de execução do exercício.
   * - Cada array interno (string[]) representa um conjunto de equipamentos OBRIGATÓRIOS EM CONJUNTO (AND).
   * - A lista externa (string[][]) representa alternativas independentes de execução (OR).
   */
  equipmentAlternatives: string[][];
  /**
   * Indica que a resistência principal é o próprio peso corporal (calistenia).
   * Nota: NÃO implica ausência de equipamento (ex.: barra fixa exige barra ou Graviton).
   */
  isBodyweight?: boolean;
  /**
   * Indica que o exercício pode ser executado livremente no solo sem exigir
   * nenhum equipamento obrigatório selecionado na academia.
   */
  canExecuteWithoutEquipment?: boolean;
  isCustom?: boolean;
  photoUrl?: string;
  shortDescription: string;
  initialPosition: string;
  executionSteps: string[];
  breathingGuide?: string;
  commonMistakes: string[];
  safetyTips: string[];
  illustrationId?: string;
  externalVideoUrl?: string;
  externalVideoSource?: string;
  /**
   * Indica se o destino remoto do link externo pôde ser efetivamente verificado
   * quanto à existência da página e correspondência ao exercício.
   * Validação apenas estrutural da URL não preenche este requisito.
   */
  externalVideoVerified?: boolean;
}

export interface WorkoutPlanItem {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  startDate: string;
  reviewDate?: string;
  notes?: string;
  instructorNotes?: string;
  divisions: WorkoutDivision[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutDivision {
  id: string;
  name: string; // e.g. "Treino A", "Treino B"
  muscleFocus: string;
  exercises: WorkoutPlanExercise[];
}

export interface WorkoutPlanExercise {
  id: string;
  exerciseId: string;
  order: number;
  prescribedSets: number;
  prescribedReps: string; // e.g. "10-12" or "12"
  prescribedWeightKg?: number;
  restIntervalSeconds: number;
  instructorNotes?: string;
}

export interface WorkoutSessionSetLog {
  setNumber: number;
  prescribedReps: string;
  prescribedWeightKg?: number;
  actualReps: number;
  actualWeightKg: number;
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutSessionExerciseLog {
  exerciseId: string;
  exerciseName: string;
  order: number;
  skipped?: boolean;
  skipReason?: string;
  notes?: string;
  sets: WorkoutSessionSetLog[];
}

export interface WorkoutSessionItem {
  id: string;
  workoutPlanId: string;
  planName?: string;
  divisionId: string;
  divisionName: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  isCompleted: boolean;
  exercisesCompleted: number;
  totalVolumeKg?: number;
  notes?: string;
  exerciseLogs?: WorkoutSessionExerciseLog[];
  // Rastreamento temporal de alta precisão (pausa, retomada e persistência)
  isPaused?: boolean;
  pausedAt?: string;
  lastResumedAt?: string;
  elapsedActiveSeconds?: number;
  pausedTotalSeconds?: number;
}

export interface CardioSessionItem {
  id: string;
  equipmentType: 'esteira' | 'bicicleta' | 'spinning' | 'eliptico' | 'escada';
  activityType: 'corrida' | 'caminhada' | 'intervalado' | 'livre';
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  distanceKm?: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  inclinePercent?: number;
  resistanceLevel?: number;
  estimatedCalories?: number;
  avgHeartRateBpm?: number;
  notes?: string;
}
