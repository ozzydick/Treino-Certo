/**
 * Metadados leves do catálogo de exercícios.
 * Mantidos separados para que os provedores globais não importem a biblioteca completa no boot.
 */
import type { GymEquipmentItem, MuscleGroupId } from '../types';

export const ORDERED_MUSCLE_GROUPS: readonly MuscleGroupId[] = [
  'peito',
  'costas',
  'ombros',
  'biceps',
  'triceps',
  'quadriceps',
  'posterior_coxa',
  'gluteos',
  'panturrilhas',
  'abdomen_core',
  'corpo_inteiro',
];

export type ExplicitCustomCompatibilityMap = Record<string, Array<string | string[]>>;

/**
 * Constrói o mapa de compatibilidade exclusivamente a partir de vínculos explícitos
 * registrados nos equipamentos personalizados do usuário.
 */
export function buildExplicitCustomCompatibilityMap(
  customEquipments: GymEquipmentItem[] = []
): ExplicitCustomCompatibilityMap {
  const map: ExplicitCustomCompatibilityMap = {};
  if (!Array.isArray(customEquipments) || customEquipments.length === 0) return map;

  for (const item of customEquipments) {
    if (
      !item ||
      !item.isCustom ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) continue;

    const customId = item.id.trim();
    if (Array.isArray(item.linkedExerciseIds)) {
      for (const rawExId of item.linkedExerciseIds) {
        if (typeof rawExId !== 'string' || !rawExId.trim()) continue;
        const exId = rawExId.trim();
        (map[exId] ||= []).push([customId]);
      }
    }

    if (
      item.linkedExerciseAlternatives &&
      typeof item.linkedExerciseAlternatives === 'object' &&
      !Array.isArray(item.linkedExerciseAlternatives)
    ) {
      for (const [rawExId, alts] of Object.entries(item.linkedExerciseAlternatives)) {
        if (typeof rawExId !== 'string' || !rawExId.trim() || !Array.isArray(alts)) continue;
        const exId = rawExId.trim();
        for (const alt of alts) {
          if (!Array.isArray(alt) || alt.length === 0) continue;
          const cleanedAlt = alt
            .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
            .map((id) => id.trim());
          if (cleanedAlt.length > 0 && cleanedAlt.includes(customId)) {
            (map[exId] ||= []).push(cleanedAlt);
          }
        }
      }
    }
  }
  return map;
}
