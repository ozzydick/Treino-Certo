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

export interface UserPreferences {
  id: string;
  theme: ThemeId;
  soundAlerts: boolean;
  vibration: boolean;
  restTimerDefaultSeconds: number;
  keepScreenAwake: boolean;
  updatedAt: string;
}

export type NavigationTab = 'home' | 'plan' | 'exercises' | 'cardio' | 'profile';

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

export interface WorkoutSessionItem {
  id: string;
  workoutPlanId: string;
  divisionId: string;
  divisionName: string;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  isCompleted: boolean;
  exercisesCompleted: number;
  totalVolumeKg?: number;
  notes?: string;
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
