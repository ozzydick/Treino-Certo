/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Info,
  ShieldAlert,
  Wind,
  Wifi,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  EQUIPMENT_CATEGORY_LABELS,
  ExerciseItem,
  GymEquipmentItem,
  MUSCLE_GROUP_LABELS,
} from '../../types';
import {
  ExplicitCustomCompatibilityMap,
  ResolvedCompatibleEquipment,
  ResolvedEquipmentAlternative,
  isExerciseCompatibleWithGym,
  isExternalVideoVerifiedAndValid,
  resolveCompatibleEquipmentsForExercise,
  resolveEquipmentAlternativesForExercise,
  validateExternalVideoUrl,
} from '../../constants/exercisesCatalog';
import {
  ExerciseIllustration,
  REALISTIC_3D_EXERCISE_IMAGES,
  classifyExerciseIllustration,
} from './ExerciseIllustration';

export interface ExerciseDetailViewModel {
  id: string;
  name: string;
  primaryMuscleLabel: string;
  secondaryMuscleLabels: string[];
  shortDescription: string;
  initialPosition: string;
  executionSteps: string[];
  breathingGuide: string | null;
  commonMistakes: string[];
  safetyTips: string[];
  isBodyweight: boolean;
  canExecuteWithoutEquipment: boolean;
  isAvailableInUserGym: boolean;
  equipmentAlternatives: ResolvedEquipmentAlternative[];
  compatibleEquipments: Array<
    ResolvedCompatibleEquipment & {
      categoryLabel: string;
      isSelectedInGym: boolean;
    }
  >;
  illustrationMode: 'specific' | 'placeholder';
  illustrationTemplateId: string;
  hasValidExternalVideo: boolean;
  isVideoUrlStructurallyValid: boolean;
  videoVerificationStatus: 'verified' | 'unverified' | 'absent' | 'invalid_url';
  validatedVideoUrl: string | null;
  externalVideoSource: string | null;
  videoUnavailableReason: string | null;
}

/**
 * Constrói o modelo de exibição completo dos detalhes do exercício, garantindo
 * regra unificada de disponibilidade por combinações/alternativas de equipamentos,
 * ilustração local e verificação rigorosa de vídeo externo.
 */
export function buildExerciseDetailViewModel(
  exercise: ExerciseItem,
  customEquipments: GymEquipmentItem[] = [],
  selectedEquipmentIds: Set<string> = new Set<string>(),
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap = {}
): ExerciseDetailViewModel {
  const resolvedEquipments = resolveCompatibleEquipmentsForExercise(
    exercise,
    customEquipments,
    explicitCustomCompatibilityMap
  ).map((eq) => ({
    ...eq,
    categoryLabel: EQUIPMENT_CATEGORY_LABELS[eq.category] || eq.category,
    isSelectedInGym: selectedEquipmentIds.has(eq.id),
  }));

  const resolvedAlternatives = resolveEquipmentAlternativesForExercise(
    exercise,
    customEquipments,
    selectedEquipmentIds,
    explicitCustomCompatibilityMap
  );

  const illustrationClass = classifyExerciseIllustration(exercise.id, exercise.name);
  const videoValidation = validateExternalVideoUrl(exercise.externalVideoUrl);
  const isVerifiedVideo = isExternalVideoVerifiedAndValid(exercise);

  let videoVerificationStatus: 'verified' | 'unverified' | 'absent' | 'invalid_url';
  let videoUnavailableReason: string | null = null;

  if (isVerifiedVideo && videoValidation.sanitizedUrl) {
    videoVerificationStatus = 'verified';
    videoUnavailableReason = null;
  } else if (videoValidation.valid && exercise.externalVideoVerified !== true) {
    videoVerificationStatus = 'unverified';
    videoUnavailableReason =
      'Referência externa configurada com URL estruturalmente válida, porém o destino remoto não pôde ser confirmado e não é apresentado como demonstração validada. Consulte as instruções passo a passo offline acima.';
  } else if (
    exercise.externalVideoUrl === undefined ||
    exercise.externalVideoUrl === null ||
    exercise.externalVideoUrl === ''
  ) {
    videoVerificationStatus = 'absent';
    videoUnavailableReason =
      'Vídeo externo demonstrativo não disponível para este exercício. Consulte as instruções passo a passo offline acima.';
  } else {
    videoVerificationStatus = 'invalid_url';
    videoUnavailableReason =
      'Vídeo externo demonstrativo não disponível para este exercício. Consulte as instruções passo a passo offline acima.';
  }

  return {
    id: exercise.id,
    name: exercise.name,
    primaryMuscleLabel:
      MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] || exercise.primaryMuscleGroup,
    secondaryMuscleLabels: (exercise.secondaryMuscleGroups || []).map(
      (group) => MUSCLE_GROUP_LABELS[group] || group
    ),
    shortDescription: exercise.shortDescription,
    initialPosition: exercise.initialPosition,
    executionSteps: exercise.executionSteps || [],
    breathingGuide:
      exercise.breathingGuide && exercise.breathingGuide.trim().length > 0
        ? exercise.breathingGuide.trim()
        : null,
    commonMistakes: exercise.commonMistakes || [],
    safetyTips: exercise.safetyTips || [],
    isBodyweight: Boolean(exercise.isBodyweight),
    canExecuteWithoutEquipment: Boolean(exercise.canExecuteWithoutEquipment),
    isAvailableInUserGym: isExerciseCompatibleWithGym(
      exercise,
      selectedEquipmentIds,
      explicitCustomCompatibilityMap,
      customEquipments
    ),
    equipmentAlternatives: resolvedAlternatives,
    compatibleEquipments: resolvedEquipments,
    illustrationMode: illustrationClass.renderMode,
    illustrationTemplateId: illustrationClass.templateId,
    hasValidExternalVideo: isVerifiedVideo,
    isVideoUrlStructurallyValid: videoValidation.valid,
    videoVerificationStatus,
    validatedVideoUrl: isVerifiedVideo ? videoValidation.sanitizedUrl : null,
    externalVideoSource: isVerifiedVideo
      ? exercise.externalVideoSource || 'Demonstração técnica externa'
      : null,
    videoUnavailableReason,
  };
}

interface ExerciseDetailModalProps {
  exercise: ExerciseItem | null;
  isOpen?: boolean;
  onClose: () => void;
  customEquipments?: GymEquipmentItem[];
  selectedEquipmentIds?: Set<string>;
  explicitCustomCompatibilityMap?: ExplicitCustomCompatibilityMap;
  onLinkCustomEquipment?: (
    customEquipmentId: string,
    exerciseId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onUnlinkCustomEquipment?: (
    customEquipmentId: string,
    exerciseId: string
  ) => Promise<{ success: boolean; error?: string }>;
  onOpenEquipments?: () => void;
  onEditCustomExercise?: (exercise: ExerciseItem) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  isOpen = true,
  onClose,
  customEquipments = [],
  selectedEquipmentIds = new Set<string>(),
  explicitCustomCompatibilityMap = {},
  onLinkCustomEquipment,
  onUnlinkCustomEquipment,
  onOpenEquipments,
  onEditCustomExercise,
}) => {
  const { themeConfig } = useTheme();

  if (!isOpen || !exercise) return null;

  const detail = buildExerciseDetailViewModel(
    exercise,
    customEquipments,
    selectedEquipmentIds,
    explicitCustomCompatibilityMap
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-detail-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-surface-card border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3 bg-surface-elevated/60 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className="font-semibold"
                style={{ color: themeConfig.primaryHex }}
              >
                {detail.primaryMuscleLabel}
              </span>
              {detail.secondaryMuscleLabels.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">
                    Secundários: {detail.secondaryMuscleLabels.join(', ')}
                  </span>
                </>
              )}
            </div>
            <h2
              id="exercise-detail-title"
              className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5"
            >
              {detail.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition shrink-0"
            aria-label="Fechar detalhes do exercício"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-slate-200">
          {/* 1. Imagem Demonstrativa Local */}
          <div className="space-y-2">
            <ExerciseIllustration
              exerciseId={exercise.id}
              name={exercise.name}
              muscleGroup={exercise.primaryMuscleGroup}
              size="lg"
              className="w-full h-48 sm:h-56"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>
                {REALISTIC_3D_EXERCISE_IMAGES[exercise.id]
                  ? 'Demonstração 3D realista local (disponível offline)'
                  : detail.illustrationMode === 'specific'
                  ? 'Ilustração vetorial biomecânica local (disponível offline)'
                  : 'Representação nominal — consulte o passo a passo técnico abaixo'}
              </span>
              {detail.isAvailableInUserGym && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Na sua academia</span>
                </span>
              )}
            </div>
          </div>

          {/* 2. Descrição Breve */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Objetivo e Biomecânica
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {detail.shortDescription}
            </p>
          </div>

          {/* 3. Equipamentos Compatíveis e Alternativas de Execução */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
                <span>Equipamentos e Alternativas de Execução</span>
              </h3>
              {onOpenEquipments && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEquipments();
                  }}
                  className="text-xs font-semibold hover:underline"
                  style={{ color: themeConfig.primaryHex }}
                >
                  Configurar minha academia
                </button>
              )}
            </div>

            {detail.canExecuteWithoutEquipment && (
              <div className="text-xs text-slate-200 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Pode ser executado livremente no solo com <strong>peso corporal</strong> sem exigir aparelho obrigatório.
                </span>
              </div>
            )}

            {detail.isBodyweight && !detail.canExecuteWithoutEquipment && (
              <div className="text-xs text-slate-300 flex items-center gap-2 p-2.5 rounded-xl bg-surface-elevated border border-white/10">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Resistência com <strong>peso corporal</strong>, mas exige estrutura específica selecionada na academia (veja as alternativas abaixo).
                </span>
              </div>
            )}

            {/* Alternativas explícitas (combinações AND vs opções OR) */}
            {detail.equipmentAlternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">
                  {detail.equipmentAlternatives.length > 1
                    ? 'Formas de execução (basta ter todos os itens de pelo menos uma alternativa):'
                    : detail.equipmentAlternatives[0].items.length > 1
                    ? 'Combinação obrigatória para execução (todos os itens abaixo em conjunto):'
                    : 'Equipamento necessário para execução:'}
                </p>

                <div className="space-y-1.5">
                  {detail.equipmentAlternatives.map((alt) => (
                    <div
                      key={alt.index}
                      className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        alt.isSatisfiedInGym
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                          : 'bg-surface-elevated border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                          {detail.equipmentAlternatives.length > 1
                            ? `Alternativa ${alt.index}${alt.items.length > 1 ? ' (combinação obrigatória)' : ''}`
                            : alt.items.length > 1
                            ? 'Combinação obrigatória'
                            : 'Opção única'}
                        </span>
                        <span className="font-semibold text-white block mt-0.5">
                          {alt.label}
                        </span>
                      </div>

                      <span
                        className={`shrink-0 text-[11px] font-semibold flex items-center gap-1 ${
                          alt.isSatisfiedInGym ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {alt.isSatisfiedInGym ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completa na academia</span>
                          </>
                        ) : (
                          <span>Incompleta / ausente</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.compatibleEquipments.length > 0 && (
              <div className="divide-y divide-white/5 rounded-2xl bg-surface-elevated border border-white/10 overflow-hidden">
                {detail.compatibleEquipments.map((eq) => (
                  <div
                    key={eq.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-white block truncate">
                        {eq.name}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {eq.categoryLabel}
                        {eq.isCustom ? ' · Personalizado (vinculado)' : ''}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 text-[11px] font-semibold flex items-center gap-1 ${
                        eq.isSelectedInGym ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {eq.isSelectedInGym ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selecionado na academia</span>
                        </>
                      ) : (
                        <span>Não selecionado</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Vínculo Explícito de Equipamentos Personalizados Cadastrados */}
            {customEquipments.length > 0 && (onLinkCustomEquipment || onUnlinkCustomEquipment) && (
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/10 space-y-2.5">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Seus Equipamentos Personalizados Cadastrados
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Equipamentos personalizados só habilitam este exercício quando vinculados explicitamente E selecionados na academia.
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {customEquipments.map((customEq) => {
                    const isExplicitlyLinked =
                      (customEq.linkedExerciseIds || []).includes(exercise.id) ||
                      Boolean(
                        customEq.linkedExerciseAlternatives &&
                          customEq.linkedExerciseAlternatives[exercise.id]?.length
                      ) ||
                      detail.compatibleEquipments.some(
                        (eq) => eq.id === customEq.id && eq.isCustom
                      );
                    const isSelectedInGym =
                      customEq.isSelected !== false && selectedEquipmentIds.has(customEq.id);

                    return (
                      <div
                        key={customEq.id}
                        className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">
                            {customEq.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {isSelectedInGym
                              ? 'Selecionado na academia'
                              : 'Cadastrado (não selecionado na academia)'}
                          </span>
                        </div>

                        {isExplicitlyLinked ? (
                          onUnlinkCustomEquipment && (
                            <button
                              type="button"
                              onClick={() => onUnlinkCustomEquipment(customEq.id, exercise.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-semibold transition shrink-0"
                            >
                              Remover vínculo
                            </button>
                          )
                        ) : (
                          onLinkCustomEquipment && (
                            <button
                              type="button"
                              onClick={() => onLinkCustomEquipment(customEq.id, exercise.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-[11px] font-semibold transition shrink-0"
                            >
                              Vincular a este exercício
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Posição Inicial */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Posição Inicial
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-surface-elevated p-3.5 rounded-2xl border border-white/5">
              {detail.initialPosition}
            </p>
          </div>

          {/* 5. Passo a Passo da Execução */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Instruções de Execução Passo a Passo
            </h3>
            <ol className="space-y-2.5">
              {detail.executionSteps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-surface-elevated border border-white/5"
                >
                  <span
                    className="w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 text-black mt-0.5 tabular-nums"
                    style={{ backgroundColor: themeConfig.primaryHex }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-200 leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* 6. Orientação sobre Respiração */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
              <span>Respiração Recomendada</span>
            </h3>
            {detail.breathingGuide ? (
              <p className="text-sm text-slate-200 leading-relaxed bg-surface-elevated p-3.5 rounded-2xl border border-white/5">
                {detail.breathingGuide}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Orientação específica de respiração não cadastrada. Mantenha respiração contínua sem apneia.
              </p>
            )}
          </div>

          {/* 7. Erros Comuns de Execução */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Erros Comuns a Evitar</span>
            </h3>
            <ul className="space-y-2">
              {detail.commonMistakes.map((mistake, index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5 bg-surface-elevated p-3 rounded-xl border border-white/5"
                >
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 8. Cuidados Importantes */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Cuidados Importantes e Segurança</span>
            </h3>
            <ul className="space-y-2">
              {detail.safetyTips.map((tip, index) => (
                <li
                  key={index}
                  className="text-xs sm:text-sm text-slate-300 leading-relaxed flex items-start gap-2.5 bg-surface-elevated p-3 rounded-xl border border-white/5"
                >
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 9. Vídeo Externo Complementar (com aviso de internet ou indisponibilidade clara) */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Demonstração em Vídeo Externo
            </h3>

            {detail.hasValidExternalVideo && detail.validatedVideoUrl ? (
              <div className="p-4 rounded-2xl bg-surface-elevated border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {detail.externalVideoSource}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Conteúdo externo complementar — depende de conexão com a internet.
                      </span>
                    </p>
                  </div>
                </div>

                <a
                  href={detail.validatedVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  <span>Abrir Demonstração Técnica Externa</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 flex items-start gap-2.5 text-xs text-slate-400">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{detail.videoUnavailableReason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Button */}
        <div className="p-4 border-t border-white/10 bg-surface-elevated/80 shrink-0 flex items-center justify-between gap-3">
          {exercise.isCustom && onEditCustomExercise ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCustomExercise(exercise);
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <span>Editar Exercício Personalizado</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-card border border-white/10 hover:border-white/25 text-xs font-bold text-white transition"
          >
            Fechar Consulta
          </button>
        </div>
      </div>
    </div>
  );
};
