/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Dumbbell } from 'lucide-react';
import { MUSCLE_GROUP_LABELS, MuscleGroupId } from '../../types';

export interface ExerciseIllustrationProps {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroupId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Paleta semântica sutil por grupo muscular para contraste em Dark Premium.
 */
const MUSCLE_GROUP_ACCENT: Record<
  MuscleGroupId,
  { stroke: string; body: string; equipment: string }
> = {
  peito: { stroke: '#F97316', body: '#E2E8F0', equipment: '#64748B' },
  costas: { stroke: '#06B6D4', body: '#E2E8F0', equipment: '#64748B' },
  ombros: { stroke: '#EC4899', body: '#E2E8F0', equipment: '#64748B' },
  biceps: { stroke: '#A855F7', body: '#E2E8F0', equipment: '#64748B' },
  triceps: { stroke: '#8B5CF6', body: '#E2E8F0', equipment: '#64748B' },
  quadriceps: { stroke: '#10B981', body: '#E2E8F0', equipment: '#64748B' },
  posterior_coxa: { stroke: '#14B8A6', body: '#E2E8F0', equipment: '#64748B' },
  gluteos: { stroke: '#F43F5E', body: '#E2E8F0', equipment: '#64748B' },
  panturrilhas: { stroke: '#22C55E', body: '#E2E8F0', equipment: '#64748B' },
  abdomen_core: { stroke: '#F59E0B', body: '#E2E8F0', equipment: '#64748B' },
  corpo_inteiro: { stroke: '#3B82F6', body: '#E2E8F0', equipment: '#64748B' },
};

/**
 * Lista oficial dos 26 exercícios que possuem ilustração vetorial biomecânica específica (1-para-1).
 */
export const SPECIFIC_ILLUSTRATION_EXERCISE_IDS: readonly string[] = [
  'ex_peito_supino_reto_barra',
  'ex_peito_supino_inclinado_halteres',
  'ex_peito_crucifixo_peck_deck',
  'ex_peito_crossover_polia_alta',
  'ex_costas_puxada_alta_frontal',
  'ex_costas_remada_baixa_triangulo',
  'ex_costas_barra_fixa_graviton',
  'ex_ombros_desenvolvimento_halteres',
  'ex_ombros_elevacao_lateral_halteres',
  'ex_biceps_rosca_direta_barra',
  'ex_biceps_rosca_scott',
  'ex_triceps_pulley_barra',
  'ex_triceps_testa_barra_w',
  'ex_quadriceps_agachamento_livre',
  'ex_quadriceps_leg_press_45',
  'ex_quadriceps_cadeira_extensora',
  'ex_posterior_mesa_flexora',
  'ex_posterior_stiff_barra',
  'ex_gluteos_elevacao_pelvica_maquina',
  'ex_gluteos_cadeira_abdutora',
  'ex_panturrilhas_em_pe_maquina',
  'ex_panturrilhas_sentado_maquina',
  'ex_abdomen_prancha_isometrica',
  'ex_abdomen_supra_solo',
  'ex_corpo_inteiro_kettlebell_swing',
  'ex_corpo_inteiro_flexao_bracos_solo',
];

export interface ExerciseIllustrationClassification {
  id: string;
  renderMode: 'specific' | 'placeholder';
  templateId: string;
  placeholderLabel: string | null;
}

/**
 * Classifica de forma determinística e 100% fiel às condições de StandardExerciseSvg
 * como cada exercício é representado visualmente:
 * - 'specific': Ilustração SVG biomecânica exclusiva (26 exercícios).
 * - 'placeholder': Placeholder nominal honesto exibindo o nome do exercício e grupo muscular,
 *   sem simular demonstração de outro movimento (10 exercícios do catálogo inicial).
 */
export function classifyExerciseIllustration(
  id: string,
  name?: string
): ExerciseIllustrationClassification {
  const specificMap: Record<string, string> = {
    ex_peito_supino_reto_barra: 'svg_exercise_supino_reto_barra',
    ex_peito_supino_inclinado_halteres: 'svg_exercise_supino_inclinado_halteres',
    ex_peito_crucifixo_peck_deck: 'svg_exercise_peck_deck',
    ex_peito_crossover_polia_alta: 'svg_exercise_crossover_polia',
    ex_costas_puxada_alta_frontal: 'svg_exercise_puxada_alta_frontal',
    ex_costas_remada_baixa_triangulo: 'svg_exercise_remada_baixa',
    ex_costas_barra_fixa_graviton: 'svg_exercise_barra_fixa',
    ex_ombros_desenvolvimento_halteres: 'svg_exercise_desenvolvimento_halteres',
    ex_ombros_elevacao_lateral_halteres: 'svg_exercise_elevacao_lateral_halteres',
    ex_biceps_rosca_direta_barra: 'svg_exercise_rosca_direta_barra',
    ex_biceps_rosca_scott: 'svg_exercise_rosca_scott',
    ex_triceps_pulley_barra: 'svg_exercise_triceps_pulley',
    ex_triceps_testa_barra_w: 'svg_exercise_triceps_testa',
    ex_quadriceps_agachamento_livre: 'svg_exercise_agachamento_livre',
    ex_quadriceps_leg_press_45: 'svg_exercise_leg_press_45',
    ex_quadriceps_cadeira_extensora: 'svg_exercise_cadeira_extensora',
    ex_posterior_mesa_flexora: 'svg_exercise_mesa_flexora',
    ex_posterior_stiff_barra: 'svg_exercise_stiff_barra',
    ex_gluteos_elevacao_pelvica_maquina: 'svg_exercise_elevacao_pelvica',
    ex_gluteos_cadeira_abdutora: 'svg_exercise_cadeira_abdutora',
    ex_panturrilhas_em_pe_maquina: 'svg_exercise_panturrilha_em_pe',
    ex_panturrilhas_sentado_maquina: 'svg_exercise_panturrilha_sentada',
    ex_abdomen_prancha_isometrica: 'svg_exercise_prancha_isometrica',
    ex_abdomen_supra_solo: 'svg_exercise_abdominal_supra',
    ex_corpo_inteiro_kettlebell_swing: 'svg_exercise_kettlebell_swing',
    ex_corpo_inteiro_flexao_bracos_solo: 'svg_exercise_flexao_bracos',
  };

  if (id in specificMap) {
    return {
      id,
      renderMode: 'specific',
      templateId: specificMap[id],
      placeholderLabel: null,
    };
  }

  return {
    id,
    renderMode: 'placeholder',
    templateId: 'placeholder_exercise_nominal',
    placeholderLabel: name || id,
  };
}

/**
 * Renderizador vetorial offline e autossuficiente para demonstração biomecânica de exercícios.
 */
export const StandardExerciseSvg: React.FC<{
  id: string;
  name?: string;
  muscleGroup: MuscleGroupId;
  size: 'sm' | 'md' | 'lg';
}> = ({ id, name, muscleGroup, size }) => {
  const accent = MUSCLE_GROUP_ACCENT[muscleGroup] || MUSCLE_GROUP_ACCENT.corpo_inteiro;
  const groupLabel = MUSCLE_GROUP_LABELS[muscleGroup] || muscleGroup;

  // 1. Supino reto com barra (atleta deitado em banco horizontal empurrando barra)
  if (id === 'ex_peito_supino_reto_barra') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_supino_reto_barra" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Banco reto e suportes */}
        <line x1="20" y1="62" x2="88" y2="62" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="30" y1="62" x2="30" y2="78" stroke="#64748B" strokeWidth="3" />
        <line x1="78" y1="62" x2="78" y2="78" stroke="#64748B" strokeWidth="3" />
        {/* Corpo em decúbito dorsal + pernas apoiadas no solo */}
        <circle cx="28" cy="54" r="5" fill={accent.body} />
        <line x1="34" y1="56" x2="74" y2="56" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="74,56 88,58 92,76" stroke={accent.body} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Braços empurrando barra verticalmente */}
        <line x1="44" y1="55" x2="44" y2="28" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        {/* Barra com anilhas */}
        <line x1="30" y1="28" x2="58" y2="28" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="33" y="21" width="4" height="14" rx="1" fill={accent.stroke} />
        <rect x="51" y="21" width="4" height="14" rx="1" fill={accent.stroke} />
        {/* Seta de vetor de movimento */}
        <path d="M64 44 L64 24 M61 28 L64 23 L67 28" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 2. Supino inclinado com halteres (banco a 35° + halteres convergentes)
  if (id === 'ex_peito_supino_inclinado_halteres') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_supino_inclinado_halteres" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Banco regulável inclinado */}
        <line x1="26" y1="36" x2="64" y2="62" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="64" y1="62" x2="82" y2="58" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="42" y1="48" x2="36" y2="76" stroke="#64748B" strokeWidth="3" />
        <line x1="72" y1="61" x2="76" y2="76" stroke="#64748B" strokeWidth="3" />
        {/* Atleta inclinado */}
        <circle cx="34" cy="30" r="5" fill={accent.body} />
        <line x1="38" y1="35" x2="64" y2="55" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="64,55 82,53 88,75" stroke={accent.body} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Braço elevando halteres */}
        <line x1="46" y1="41" x2="48" y2="18" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="41" y="15" width="14" height="5" rx="1.5" fill="#F8FAFC" />
        <path d="M62 36 L62 18 M59 22 L62 17 L65 22" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 3. Voador peitoral (Peck deck / Crucifixo máquina - adução horizontal)
  if (id === 'ex_peito_crucifixo_peck_deck') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_peck_deck" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Coluna central da máquina */}
        <rect x="54" y="14" width="12" height="62" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        {/* Torso visto de frente/topo e braços fechando em arco */}
        <circle cx="60" cy="34" r="5.5" fill={accent.body} />
        <rect x="51" y="42" width="18" height="24" rx="4" fill={accent.body} />
        {/* Hastes articuladas e arco de adução */}
        <path d="M26 20 Q28 46 49 48" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M94 20 Q92 46 71 48" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        {/* Setas convergentes */}
        <path d="M32 54 Q46 58 55 54" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M88 54 Q74 58 65 54" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  // 4. Crossover na polia alta (cabos descendo em arco convergente)
  if (id === 'ex_peito_crossover_polia_alta') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_crossover_polia" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Torres laterais */}
        <line x1="16" y1="14" x2="16" y2="76" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="104" y1="14" x2="104" y2="76" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
        {/* Cabos das polias superiores até as mãos no centro */}
        <line x1="16" y1="18" x2="54" y2="54" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 2" />
        <line x1="104" y1="18" x2="66" y2="54" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 2" />
        {/* Atleta no centro */}
        <circle cx="60" cy="30" r="5" fill={accent.body} />
        <line x1="60" y1="36" x2="60" y2="58" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="60" y1="58" x2="53" y2="76" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="58" x2="67" y2="76" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        {/* Braços convergindo à frente do quadril/esterno */}
        <line x1="58" y1="40" x2="54" y2="54" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="62" y1="40" x2="66" y2="54" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 5. Puxada alta frontal na polia
  if (id === 'ex_costas_puxada_alta_frontal') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_puxada_alta_frontal" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Torre da polia alta */}
        <line x1="30" y1="12" x2="30" y2="76" stroke="#64748B" strokeWidth="3.5" />
        <line x1="30" y1="14" x2="66" y2="14" stroke="#64748B" strokeWidth="3.5" />
        <line x1="66" y1="14" x2="66" y2="32" stroke="#94A3B8" strokeWidth="2" />
        {/* Barra larga de puxada */}
        <path d="M46 34 L52 30 L80 30 L86 34" stroke="#F8FAFC" strokeWidth="2.8" strokeLinecap="round" />
        {/* Atleta sentado puxando à frente */}
        <circle cx="66" cy="42" r="4.5" fill={accent.body} />
        <line x1="66" y1="48" x2="68" y2="64" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="68,64 52,64 52,76" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        {/* Braços tracionando a barra */}
        <polyline points="50,32 56,46 65,48" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="82,32 76,46 67,48" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 6. Remada baixa sentada na polia
  if (id === 'ex_costas_remada_baixa_triangulo') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_remada_baixa" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Base horizontal e torre frontal */}
        <line x1="18" y1="72" x2="98" y2="72" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="18" y="24" width="12" height="48" rx="2" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
        {/* Cabo horizontal */}
        <line x1="30" y1="54" x2="68" y2="54" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 2" />
        {/* Atleta sentado com coluna ereta e joelhos semiflexionados */}
        <circle cx="76" cy="34" r="5" fill={accent.body} />
        <line x1="76" y1="41" x2="76" y2="66" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="76,66 56,60 36,66" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Braço puxando o triângulo até o abdômen */}
        <polyline points="75,45 84,54 68,54" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 7. Barra fixa (livre ou assistida no Graviton)
  if (id === 'ex_costas_barra_fixa_graviton') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_barra_fixa" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Pórtico superior da barra fixa */}
        <line x1="28" y1="16" x2="92" y2="16" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="34" y1="16" x2="34" y2="78" stroke="#475569" strokeWidth="3" />
        <line x1="86" y1="16" x2="86" y2="78" stroke="#475569" strokeWidth="3" />
        {/* Atleta elevando o tronco na barra */}
        <circle cx="60" cy="24" r="5" fill={accent.body} />
        <line x1="60" y1="30" x2="60" y2="54" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="60" y1="54" x2="56" y2="74" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="54" x2="64" y2="74" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        {/* Braços em tração vertical */}
        <polyline points="44,16 48,32 58,34" stroke={accent.stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="76,16 72,32 62,34" stroke={accent.stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 8. Desenvolvimento de ombros com halteres
  if (id === 'ex_ombros_desenvolvimento_halteres') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_desenvolvimento_halteres" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Banco 85° de desenvolvimento */}
        <line x1="56" y1="34" x2="56" y2="66" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        <line x1="56" y1="66" x2="74" y2="66" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
        {/* Atleta sentado empurrando halteres acima da cabeça */}
        <circle cx="60" cy="36" r="5" fill={accent.body} />
        <line x1="60" y1="42" x2="60" y2="64" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        {/* Braços elevados com halteres */}
        <polyline points="56,44 42,38 42,20" stroke={accent.stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="64,44 78,38 78,20" stroke={accent.stroke} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="36" y="16" width="12" height="4.5" rx="1" fill="#F8FAFC" />
        <rect x="72" y="16" width="12" height="4.5" rx="1" fill="#F8FAFC" />
      </svg>
    );
  }

  // 9. Elevação lateral com halteres
  if (id === 'ex_ombros_elevacao_lateral_halteres') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_elevacao_lateral_halteres" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Atleta em pé abduzindo os ombros até a linha horizontal */}
        <circle cx="60" cy="24" r="5" fill={accent.body} />
        <line x1="60" y1="31" x2="60" y2="56" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="60" y1="56" x2="53" y2="76" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="56" x2="67" y2="76" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
        {/* Braços abertos lateralmente na linha dos ombros */}
        <line x1="56" y1="35" x2="28" y2="36" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="64" y1="35" x2="92" y2="36" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="21" y="33" width="9" height="6" rx="1" fill="#F8FAFC" />
        <rect x="90" y="33" width="9" height="6" rx="1" fill="#F8FAFC" />
        {/* Arco de abdução */}
        <path d="M38 54 Q30 46 30 40" stroke={accent.stroke} strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M82 54 Q90 46 90 40" stroke={accent.stroke} strokeWidth="1.5" strokeDasharray="2 2" />
      </svg>
    );
  }

  // 10. Rosca direta com barra
  if (id === 'ex_biceps_rosca_direta_barra') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_rosca_direta_barra" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Atleta em pé em perfil realizando flexão de cotovelo */}
        <circle cx="52" cy="22" r="5" fill={accent.body} />
        <line x1="52" y1="29" x2="52" y2="56" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="52" y1="56" x2="48" y2="76" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" />
        <line x1="52" y1="56" x2="56" y2="76" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" />
        {/* Braço fixo ao tronco e antebraço subindo a barra */}
        <polyline points="52,32 54,48 72,36" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="74" cy="35" r="5" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2" />
        <path d="M74 54 Q82 44 77 36" stroke={accent.stroke} strokeWidth="1.8" strokeDasharray="2 2" />
      </svg>
    );
  }

  // 11. Rosca bíceps no banco Scott
  if (id === 'ex_biceps_rosca_scott') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_rosca_scott" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Estrutura do Banco Scott */}
        <line x1="20" y1="76" x2="96" y2="76" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
        <polygon points="56,36 72,54 66,58 50,40" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
        <line x1="60" y1="52" x2="60" y2="76" stroke="#64748B" strokeWidth="3" />
        {/* Atleta apoiando os braços na rampa Scott */}
        <circle cx="42" cy="28" r="5" fill={accent.body} />
        <line x1="42" y1="34" x2="38" y2="58" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="44,36 62,48 74,34" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="76" cy="32" r="4.5" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2" />
      </svg>
    );
  }

  // 12. Tríceps na polia alta (Pulley)
  if (id === 'ex_triceps_pulley_barra') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_triceps_pulley" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Coluna da polia alta */}
        <line x1="34" y1="14" x2="34" y2="76" stroke="#64748B" strokeWidth="3.5" />
        <line x1="34" y1="14" x2="56" y2="14" stroke="#64748B" strokeWidth="3.5" />
        <line x1="56" y1="14" x2="56" y2="54" stroke="#94A3B8" strokeWidth="1.8" strokeDasharray="3 2" />
        {/* Atleta em pé estendendo os cotovelos para baixo */}
        <circle cx="74" cy="24" r="5" fill={accent.body} />
        <line x1="74" y1="30" x2="76" y2="56" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="76" y1="56" x2="72" y2="76" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" />
        <polyline points="72,34 70,48 56,56" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 38 L50 56 M47 52 L50 57 L53 52" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 13. Tríceps testa deitado com barra W
  if (id === 'ex_triceps_testa_barra_w') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_triceps_testa" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Banco reto */}
        <line x1="20" y1="62" x2="88" y2="62" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="32" y1="62" x2="32" y2="78" stroke="#64748B" strokeWidth="3" />
        <line x1="76" y1="62" x2="76" y2="78" stroke="#64748B" strokeWidth="3" />
        {/* Corpo deitado */}
        <circle cx="30" cy="54" r="5" fill={accent.body} />
        <line x1="36" y1="56" x2="74" y2="56" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        {/* Braço inclinado e flexão/extensão do cotovelo na direção da testa */}
        <polyline points="42,54 38,34 26,44" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="44" r="4" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="1.8" />
        <path d="M24 34 Q30 24 42 26" stroke={accent.stroke} strokeWidth="1.8" strokeDasharray="2 2" />
      </svg>
    );
  }

  // 14. Agachamento livre com barra
  if (id === 'ex_quadriceps_agachamento_livre') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_agachamento_livre" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rack vertical de segurança */}
        <line x1="32" y1="14" x2="32" y2="78" stroke="#475569" strokeWidth="3.5" />
        <line x1="24" y1="78" x2="96" y2="78" stroke="#475569" strokeWidth="3" />
        {/* Atleta na fase baixa do agachamento */}
        <circle cx="66" cy="26" r="5" fill={accent.body} />
        {/* Barra apoiada sobre o trapézio */}
        <circle cx="60" cy="33" r="6" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2.5" />
        {/* Tronco, coxa paralela e canela */}
        <polyline points="60,34 48,54 68,54 62,76" stroke={accent.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Seta vertical de subida */}
        <path d="M84 62 L84 34 M80 39 L84 33 L88 39" stroke={accent.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 15. Leg press 45°
  if (id === 'ex_quadriceps_leg_press_45') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_leg_press_45" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Trilho 45° e assento */}
        <line x1="20" y1="74" x2="100" y2="74" stroke="#475569" strokeWidth="3.5" />
        <line x1="30" y1="24" x2="88" y2="66" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        <line x1="76" y1="68" x2="96" y2="50" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        {/* Plataforma inclinada e pernas empurrando */}
        <line x1="42" y1="42" x2="54" y2="24" stroke="#F8FAFC" strokeWidth="4" strokeLinecap="round" />
        <circle cx="92" cy="44" r="4.5" fill={accent.body} />
        <polyline points="88,48 76,64 62,48 48,34" stroke={accent.stroke} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 16. Cadeira extensora
  if (id === 'ex_quadriceps_cadeira_extensora') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_cadeira_extensora" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Assento e encosto da cadeira */}
        <line x1="38" y1="26" x2="44" y2="56" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="44" y1="56" x2="66" y2="56" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
        <line x1="52" y1="56" x2="52" y2="76" stroke="#64748B" strokeWidth="3.5" />
        {/* Atleta sentado estendendo os joelhos */}
        <circle cx="44" cy="20" r="4.5" fill={accent.body} />
        <line x1="44" y1="26" x2="48" y2="54" stroke={accent.body} strokeWidth="4.2" strokeLinecap="round" />
        <polyline points="48,54 68,54 92,48" stroke={accent.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="90" cy="50" r="3.5" fill="#F8FAFC" />
        <path d="M76 68 Q88 62 92 52" stroke={accent.stroke} strokeWidth="1.8" strokeDasharray="2 2" />
      </svg>
    );
  }

  // 17. Mesa flexora deitado
  if (id === 'ex_posterior_mesa_flexora') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_mesa_flexora" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Prancha da mesa flexora */}
        <polyline points="22,56 58,48 92,54" stroke="#475569" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="34" y1="54" x2="34" y2="76" stroke="#64748B" strokeWidth="3" />
        <line x1="80" y1="52" x2="80" y2="76" stroke="#64748B" strokeWidth="3" />
        {/* Atleta em decúbito ventral flexionando os joelhos */}
        <circle cx="24" cy="46" r="4.5" fill={accent.body} />
        <line x1="30" y1="48" x2="60" y2="43" stroke={accent.body} strokeWidth="4.2" strokeLinecap="round" />
        <polyline points="60,43 84,48 74,26" stroke={accent.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="74" cy="26" r="3.5" fill="#F8FAFC" />
      </svg>
    );
  }

  // 18. Stiff com barra ou halteres
  if (id === 'ex_posterior_stiff_barra') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_stiff_barra" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Atleta em dobradiça de quadril (hip hinge) com coluna neutra */}
        <circle cx="76" cy="30" r="5" fill={accent.body} />
        <line x1="70" y1="33" x2="40" y2="44" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        {/* Pernas semiflexionadas com quadril projetado para trás */}
        <polyline points="40,44 46,60 46,76" stroke={accent.stroke} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Braços verticais segurando a barra rente à canela */}
        <line x1="64" y1="36" x2="64" y2="60" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="64" cy="62" r="5.5" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2" />
      </svg>
    );
  }

  // 19. Elevação pélvica (Glute drive / barra)
  if (id === 'ex_gluteos_elevacao_pelvica_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_elevacao_pelvica" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Apoio dorsal e solo */}
        <rect x="20" y="46" width="16" height="28" rx="2" fill="#334155" stroke="#64748B" strokeWidth="2" />
        <line x1="16" y1="74" x2="104" y2="74" stroke="#475569" strokeWidth="3" />
        {/* Corpo em ponte horizontal no topo da elevação pélvica */}
        <circle cx="28" cy="38" r="4.5" fill={accent.body} />
        <polyline points="32,44 62,44 82,44 82,74" stroke={accent.stroke} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Cinto/barra sobre a pelve */}
        <circle cx="62" cy="40" r="5" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2" />
        <path d="M62 64 L62 50 M59 54 L62 49 L65 54" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 20. Abdução de quadril na cadeira abdutora
  if (id === 'ex_gluteos_cadeira_abdutora') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_cadeira_abdutora" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Assento visto superior/frontal com coxas afastando os apoios */}
        <rect x="46" y="20" width="28" height="24" rx="4" fill="#334155" stroke="#64748B" strokeWidth="2" />
        <polyline points="52,42 32,68" stroke={accent.stroke} strokeWidth="5" strokeLinecap="round" />
        <polyline points="68,42 88,68" stroke={accent.stroke} strokeWidth="5" strokeLinecap="round" />
        {/* Apoios laterais e setas de abertura */}
        <rect x="24" y="54" width="6" height="14" rx="2" fill="#F8FAFC" />
        <rect x="90" y="54" width="6" height="14" rx="2" fill="#F8FAFC" />
        <path d="M40 58 L22 58 M26 55 L21 58 L26 61" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 58 L98 58 M94 55 L99 58 L94 61" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 21. Elevação de panturrilhas em pé na máquina
  if (id === 'ex_panturrilhas_em_pe_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_panturrilha_em_pe" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Degrau inferior e ombreiras superiores */}
        <rect x="44" y="68" width="24" height="8" rx="1.5" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
        <rect x="46" y="24" width="24" height="6" rx="2" fill={accent.stroke} />
        {/* Atleta em pé na ponta dos pés */}
        <circle cx="58" cy="16" r="4.5" fill={accent.body} />
        <line x1="58" y1="24" x2="58" y2="58" stroke={accent.body} strokeWidth="4.2" strokeLinecap="round" />
        <polyline points="58,58 64,64 56,68" stroke={accent.stroke} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M78 66 L78 46 M75 50 L78 45 L81 50" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 22. Elevação de panturrilhas sentado
  if (id === 'ex_panturrilhas_sentado_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_panturrilha_sentada" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Banco e degrau frontal */}
        <rect x="26" y="48" width="22" height="6" rx="1.5" fill="#475569" />
        <line x1="36" y1="54" x2="36" y2="76" stroke="#64748B" strokeWidth="3" />
        <rect x="68" y="68" width="16" height="7" rx="1.5" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Atleta sentado com joelhos a 90° e almofada sobre os joelhos */}
        <circle cx="36" cy="24" r="4.5" fill={accent.body} />
        <polyline points="36,30 36,48 68,46 72,68" stroke={accent.body} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="62" y="38" width="14" height="6" rx="2" fill={accent.stroke} />
        <path d="M88 64 L88 44 M85 48 L88 43 L91 48" stroke={accent.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // 23. Prancha abdominal isométrica
  if (id === 'ex_abdomen_prancha_isometrica') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_prancha_isometrica" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Colchonete no solo */}
        <line x1="16" y1="68" x2="104" y2="68" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        {/* Atleta alinhado em prancha apoiado nos antebraços */}
        <circle cx="88" cy="44" r="4.5" fill={accent.body} />
        <line x1="82" y1="46" x2="26" y2="58" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="78,47 78,64 88,64" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="26" y1="58" x2="24" y2="65" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 24. Abdominal supra no solo
  if (id === 'ex_abdomen_supra_solo') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_abdominal_supra" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Colchonete */}
        <line x1="16" y1="68" x2="104" y2="68" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
        {/* Atleta com joelhos flexionados elevando as escápulas do solo */}
        <circle cx="32" cy="44" r="4.5" fill={accent.body} />
        <path d="M36 48 Q48 64 64 64" stroke={accent.stroke} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="64,64 78,46 92,65" stroke={accent.body} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 34 Q46 30 52 38" stroke={accent.stroke} strokeWidth="1.8" strokeDasharray="2 2" />
      </svg>
    );
  }

  // 25. Kettlebell swing
  if (id === 'ex_corpo_inteiro_kettlebell_swing') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_kettlebell_swing" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Atleta estendendo o quadril e projetando o kettlebell à frente */}
        <circle cx="46" cy="22" r="5" fill={accent.body} />
        <line x1="46" y1="29" x2="46" y2="54" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <line x1="46" y1="54" x2="40" y2="76" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" />
        <line x1="46" y1="54" x2="52" y2="76" stroke={accent.body} strokeWidth="3.8" strokeLinecap="round" />
        {/* Braços estendidos com Kettlebell à frente + arco balístico */}
        <line x1="48" y1="34" x2="78" y2="34" stroke={accent.stroke} strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="84" cy="34" r="5.5" fill="#F8FAFC" stroke={accent.stroke} strokeWidth="2" />
        <path d="M54 64 Q84 62 84 42" stroke={accent.stroke} strokeWidth="1.8" strokeDasharray="3 2" />
      </svg>
    );
  }

  // 26. Flexão de braços tradicional no solo
  if (id === 'ex_corpo_inteiro_flexao_bracos_solo') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_exercise_flexao_bracos" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Solo */}
        <line x1="16" y1="68" x2="104" y2="68" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
        {/* Corpo alinhado em prancha realizando empurrão no solo */}
        <circle cx="88" cy="38" r="4.5" fill={accent.body} />
        <line x1="82" y1="41" x2="26" y2="58" stroke={accent.body} strokeWidth="4.5" strokeLinecap="round" />
        <polyline points="76,43 70,54 78,65" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="26" y1="58" x2="24" y2="65" stroke={accent.body} strokeWidth="3.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Placeholder visual nominal honesto (quando não há ilustração específica validada para o exercício)
  return (
    <div
      data-render-mode="placeholder"
      data-template-id="placeholder_exercise_nominal"
      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-1 shrink-0">
        <Dumbbell className="w-4 h-4" style={{ color: accent.stroke }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-200 truncate max-w-[92%]">
        {name || id}
      </span>
      <span className="text-[8px] text-slate-400 uppercase tracking-wider mt-0.5">
        {groupLabel}
      </span>
      {size === 'lg' && (
        <span className="text-[10px] text-slate-400 mt-1.5 max-w-[230px] leading-snug">
          Ilustração específica não disponível — consulte o passo a passo abaixo.
        </span>
      )}
    </div>
  );
};

export const REALISTIC_3D_EXERCISE_IMAGES: Record<string, string> = {
  ex_peito_supino_inclinado_halteres: '/images/exercises/ex_peito_supino_inclinado_halteres.webp',
  ex_peito_supino_reto_barra: '/images/exercises/ex_peito_supino_reto_barra.webp',
  ex_peito_crucifixo_peck_deck: '/images/exercises/ex_peito_crucifixo_peck_deck.webp',
  ex_peito_crossover_polia_alta: '/images/exercises/ex_peito_crossover_polia_alta.webp',
  ex_peito_supino_reto_halteres: '/images/exercises/ex_peito_supino_reto_halteres.webp',
  ex_peito_supino_inclinado_barra: '/images/exercises/ex_peito_supino_inclinado_barra.webp',
  ex_peito_crucifixo_reto_halteres: '/images/exercises/ex_peito_crucifixo_reto_halteres.webp',
  ex_peito_flexao_bracos: '/images/exercises/ex_peito_flexao_bracos.webp',
  ex_costas_puxada_alta_frontal: '/images/exercises/ex_costas_puxada_alta_frontal.webp',
  ex_costas_remada_baixa_triangulo: '/images/exercises/ex_costas_remada_baixa_triangulo.webp',
  ex_costas_remada_articulada_maquina: '/images/exercises/ex_costas_remada_articulada_maquina.webp',
  ex_costas_barra_fixa_graviton: '/images/exercises/ex_costas_barra_fixa_graviton.webp',
  ex_costas_remada_curvada_barra: '/images/exercises/ex_costas_remada_curvada_barra.webp',
  ex_costas_remada_unilateral_halter: '/images/exercises/ex_costas_remada_unilateral_halter.webp',
  ex_costas_pullover_polia: '/images/exercises/ex_costas_pullover_polia.webp',
  ex_costas_remada_banco_inclinado: '/images/exercises/ex_costas_remada_banco_inclinado.webp',
  ex_quadriceps_agachamento_livre: '/images/exercises/ex_quadriceps_agachamento_livre.webp',
  ex_quadriceps_leg_press_45: '/images/exercises/ex_quadriceps_leg_press_45.webp',
  ex_quadriceps_cadeira_extensora: '/images/exercises/ex_quadriceps_cadeira_extensora.webp',
  ex_quadriceps_hack_squat: '/images/exercises/ex_quadriceps_hack_squat.webp',
  ex_posterior_mesa_flexora: '/images/exercises/ex_posterior_mesa_flexora.webp',
  ex_posterior_cadeira_flexora: '/images/exercises/ex_posterior_cadeira_flexora.webp',
  ex_posterior_stiff_barra: '/images/exercises/ex_posterior_stiff_barra.webp',
  ex_posterior_cadeira_flexora_unilateral: '/images/exercises/ex_posterior_cadeira_flexora_unilateral.webp',
  ex_posterior_terra_romeno_unilateral_halter: '/images/exercises/ex_posterior_terra_romeno_unilateral_halter.webp',
  ex_gluteos_elevacao_pelvica_maquina: '/images/exercises/ex_gluteos_elevacao_pelvica_maquina.webp',
  ex_gluteos_cadeira_abdutora: '/images/exercises/ex_gluteos_cadeira_abdutora.webp',
  ex_gluteos_extensao_quadril_maquina: '/images/exercises/ex_gluteos_extensao_quadril_maquina.webp',
  ex_panturrilhas_em_pe_maquina: '/images/exercises/ex_panturrilhas_em_pe_maquina.webp',
  ex_panturrilhas_sentado_maquina: '/images/exercises/ex_panturrilhas_sentado_maquina.webp',
  ex_panturrilhas_leg_press: '/images/exercises/ex_panturrilhas_leg_press.webp',
  ex_panturrilhas_unilateral_em_pe_maquina: '/images/exercises/ex_panturrilhas_unilateral_em_pe_maquina.webp',
};

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({
  exerciseId,
  name,
  muscleGroup,
  size = 'md',
  className = '',
}) => {
  const realisticImageSrc = REALISTIC_3D_EXERCISE_IMAGES[exerciseId];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-surface-elevated via-surface-card to-surface-dark flex items-center justify-center rounded-xl border border-white/10 ${className}`}
      title={name}
    >
      {realisticImageSrc ? (
        <img
          src={realisticImageSrc}
          alt={`Demonstração 3D realista: ${name}, posições inicial e final`}
          className="w-full h-full object-contain object-center p-1"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <StandardExerciseSvg id={exerciseId} name={name} muscleGroup={muscleGroup} size={size} />
      )}
    </div>
  );
};

