/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EquipmentCategory, EQUIPMENT_CATEGORY_LABELS, GymEquipmentItem } from '../types';

export interface CatalogEquipmentDefinition {
  id: string;
  name: string;
  category: EquipmentCategory;
  description?: string;
}

/**
 * Catálogo padrão oficial de equipamentos do TREINO CERTO (Checkpoint 02).
 * Disponibilizado de forma nativa e offline pelo aplicativo.
 */
export const DEFAULT_EQUIPMENTS_CATALOG: readonly CatalogEquipmentDefinition[] = [
  // --- Peito (7 equipamentos) ---
  {
    id: 'std_chest_supino_reto_barra',
    name: 'Supino reto com barra',
    category: 'chest',
  },
  {
    id: 'std_chest_supino_inclinado_barra',
    name: 'Supino inclinado com barra',
    category: 'chest',
  },
  {
    id: 'std_chest_supino_declinado',
    name: 'Supino declinado',
    category: 'chest',
  },
  {
    id: 'std_chest_supino_maquina',
    name: 'Supino máquina',
    category: 'chest',
  },
  {
    id: 'std_chest_peck_deck',
    name: 'Peck deck',
    category: 'chest',
  },
  {
    id: 'std_chest_crossover',
    name: 'Crossover',
    category: 'chest',
  },
  {
    id: 'std_chest_crucifixo_maquina',
    name: 'Crucifixo máquina',
    category: 'chest',
  },

  // --- Costas (7 equipamentos) ---
  {
    id: 'std_back_puxada_alta',
    name: 'Puxada alta',
    category: 'back',
  },
  {
    id: 'std_back_remada_baixa',
    name: 'Remada baixa',
    category: 'back',
  },
  {
    id: 'std_back_remada_articulada',
    name: 'Remada articulada',
    category: 'back',
  },
  {
    id: 'std_back_remada_cavalinho',
    name: 'Remada cavalinho',
    category: 'back',
  },
  {
    id: 'std_back_pulldown',
    name: 'Pulldown',
    category: 'back',
  },
  {
    id: 'std_back_barra_fixa',
    name: 'Barra fixa',
    category: 'back',
  },
  {
    id: 'std_back_graviton',
    name: 'Graviton',
    category: 'back',
  },

  // --- Pernas e glúteos (14 equipamentos) ---
  {
    id: 'std_legs_leg_press_45',
    name: 'Leg press 45°',
    category: 'legs',
  },
  {
    id: 'std_legs_leg_press_horizontal',
    name: 'Leg press horizontal',
    category: 'legs',
  },
  {
    id: 'std_legs_cadeira_extensora',
    name: 'Cadeira extensora',
    category: 'legs',
  },
  {
    id: 'std_legs_mesa_flexora',
    name: 'Mesa flexora',
    category: 'legs',
  },
  {
    id: 'std_legs_cadeira_flexora',
    name: 'Cadeira flexora',
    category: 'legs',
  },
  {
    id: 'std_legs_cadeira_abdutora',
    name: 'Cadeira abdutora',
    category: 'legs',
  },
  {
    id: 'std_legs_cadeira_adutora',
    name: 'Cadeira adutora',
    category: 'legs',
  },
  {
    id: 'std_legs_hack_squat',
    name: 'Hack squat',
    category: 'legs',
  },
  {
    id: 'std_legs_smith_machine',
    name: 'Smith machine',
    category: 'legs',
  },
  {
    id: 'std_legs_agachamento_livre_rack',
    name: 'Agachamento livre com rack',
    category: 'legs',
  },
  {
    id: 'std_legs_panturrilha_sentada',
    name: 'Panturrilha sentada',
    category: 'legs',
  },
  {
    id: 'std_legs_panturrilha_em_pe',
    name: 'Panturrilha em pé',
    category: 'legs',
  },
  {
    id: 'std_legs_glute_drive',
    name: 'Glute drive',
    category: 'legs',
  },
  {
    id: 'std_legs_maquina_gluteo',
    name: 'Máquina de glúteo',
    category: 'legs',
  },

  // --- Ombros (5 equipamentos) ---
  {
    id: 'std_shoulders_desenvolvimento_maquina',
    name: 'Desenvolvimento máquina',
    category: 'shoulders',
  },
  {
    id: 'std_shoulders_desenvolvimento_halteres',
    name: 'Desenvolvimento com halteres',
    category: 'shoulders',
  },
  {
    id: 'std_shoulders_elevacao_lateral_maquina',
    name: 'Elevação lateral máquina',
    category: 'shoulders',
  },
  {
    id: 'std_shoulders_maquina_elevacao_lateral',
    name: 'Máquina de elevação lateral',
    category: 'shoulders',
  },
  {
    id: 'std_shoulders_banco_desenvolvimento',
    name: 'Banco para desenvolvimento',
    category: 'shoulders',
  },

  // --- Bíceps e tríceps (5 equipamentos) ---
  {
    id: 'std_arms_maquina_biceps',
    name: 'Máquina de bíceps',
    category: 'arms',
  },
  {
    id: 'std_arms_banco_scott',
    name: 'Banco Scott',
    category: 'arms',
  },
  {
    id: 'std_arms_polia_triceps',
    name: 'Polia para tríceps',
    category: 'arms',
  },
  {
    id: 'std_arms_maquina_triceps',
    name: 'Máquina de tríceps',
    category: 'arms',
  },
  {
    id: 'std_arms_barras_puxadores_polia',
    name: 'Barras e puxadores de polia',
    category: 'arms',
  },

  // --- Equipamentos gerais (11 equipamentos) ---
  {
    id: 'std_general_halteres',
    name: 'Halteres',
    category: 'general',
  },
  {
    id: 'std_general_barras_retas',
    name: 'Barras retas',
    category: 'general',
  },
  {
    id: 'std_general_barras_w',
    name: 'Barras W',
    category: 'general',
  },
  {
    id: 'std_general_anilhas',
    name: 'Anilhas',
    category: 'general',
  },
  {
    id: 'std_general_bancos_retos',
    name: 'Bancos retos',
    category: 'general',
  },
  {
    id: 'std_general_bancos_regulaveis',
    name: 'Bancos reguláveis',
    category: 'general',
  },
  {
    id: 'std_general_rack_agachamento',
    name: 'Rack de agachamento',
    category: 'general',
  },
  {
    id: 'std_general_polias_ajustaveis',
    name: 'Polias ajustáveis',
    category: 'general',
  },
  {
    id: 'std_general_colchonetes',
    name: 'Colchonetes',
    category: 'general',
  },
  {
    id: 'std_general_kettlebells',
    name: 'Kettlebells',
    category: 'general',
  },
  {
    id: 'std_general_elasticos_resistencia',
    name: 'Elásticos de resistência',
    category: 'general',
  },

  // --- Cardio (5 equipamentos) ---
  {
    id: 'std_cardio_esteira',
    name: 'Esteira',
    category: 'cardio',
  },
  {
    id: 'std_cardio_bicicleta_ergometrica',
    name: 'Bicicleta ergométrica',
    category: 'cardio',
  },
  {
    id: 'std_cardio_spinning',
    name: 'Spinning',
    category: 'cardio',
  },
  {
    id: 'std_cardio_eliptico',
    name: 'Elíptico',
    category: 'cardio',
  },
  {
    id: 'std_cardio_simulador_escada',
    name: 'Simulador de escada',
    category: 'cardio',
  },
];

/**
 * Categorias ordenadas para exibição no catálogo
 */
export const ORDERED_CATEGORIES: EquipmentCategory[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'general',
  'cardio',
];

/**
 * Normaliza uma string de nome para comparação sem distinção de maiúsculas/minúsculas,
 * acentos e espaços excedentes.
 */
export function normalizeEquipmentName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Verifica se já existe um equipamento com o mesmo nome na mesma categoria
 * (seja no catálogo padrão ou em uma lista existente).
 */
export function checkDuplicateEquipment(
  name: string,
  category: EquipmentCategory,
  existingList: GymEquipmentItem[],
  excludeId?: string
): boolean {
  const normalized = normalizeEquipmentName(name);

  // 1. Verifica no catálogo padrão
  const inDefault = DEFAULT_EQUIPMENTS_CATALOG.some(
    (item) =>
      item.id !== excludeId &&
      item.category === category &&
      normalizeEquipmentName(item.name) === normalized
  );
  if (inDefault) return true;

  // 2. Verifica na lista fornecida (personalizados e selecionados)
  const inExisting = existingList.some(
    (item) =>
      item.id !== excludeId &&
      item.category === category &&
      normalizeEquipmentName(item.name) === normalized
  );
  return inExisting;
}
