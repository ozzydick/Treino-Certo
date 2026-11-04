/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Dumbbell } from 'lucide-react';
import { EquipmentCategory } from '../../types';

interface EquipmentIllustrationProps {
  equipmentId: string;
  category: EquipmentCategory;
  name?: string;
  isCustom?: boolean;
  customPhotoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EquipmentIllustration: React.FC<EquipmentIllustrationProps> = ({
  equipmentId,
  category,
  name,
  isCustom = false,
  customPhotoUrl,
  size = 'md',
  className = '',
}) => {
  // Se for equipamento personalizado e possuir foto real cadastrada pelo usuário
  if (isCustom && customPhotoUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-surface-dark flex items-center justify-center rounded-xl border border-white/10 ${className}`}
      >
        <img
          src={customPhotoUrl}
          alt={name || 'Foto do equipamento personalizado'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-semibold text-white/90 flex items-center gap-1 border border-white/10">
          <Camera className="w-2.5 h-2.5 text-orange-400" />
          <span>Foto Real</span>
        </div>
      </div>
    );
  }

  // Se for equipamento personalizado sem foto cadastrada
  if (isCustom) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-surface-elevated to-surface-card flex flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-2 text-center ${className}`}
      >
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-1">
          <Camera className="w-4 h-4 text-slate-400" />
        </div>
        {size === 'lg' ? (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-300">Sem foto cadastrada</p>
            <p className="text-[10px] text-slate-500 max-w-[200px]">
              Tire uma foto do aparelho na sua academia ou adicione uma imagem da sua galeria
            </p>
          </div>
        ) : (
          <span className="text-[9px] font-medium text-slate-400">Sem foto</span>
        )}
      </div>
    );
  }

  // Para o catálogo padrão de 54 equipamentos: Renderiza a representação vetorial SVG correspondente
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-surface-elevated via-surface-card to-surface-dark flex items-center justify-center rounded-xl border border-white/10 ${className}`}
      title={name}
    >
      <StandardEquipmentSvg id={equipmentId} category={category} name={name} size={size} />
    </div>
  );
};

/**
 * Renderizador de arte vetorial SVG offline e autossuficiente para cada equipamento padrão
 */
export const StandardEquipmentSvg: React.FC<{
  id: string;
  category: EquipmentCategory;
  name?: string;
  size: 'sm' | 'md' | 'lg';
}> = ({ id, category, name, size }) => {
  // Paletas refinadas de biomecânica por categoria para contraste Dark Premium
  const categoryAccent: Record<EquipmentCategory, { stroke: string; glow: string; seat: string }> = {
    chest: { stroke: '#F97316', glow: 'rgba(249,115,22,0.15)', seat: '#334155' },
    back: { stroke: '#06B6D4', glow: 'rgba(6,182,212,0.15)', seat: '#334155' },
    legs: { stroke: '#10B981', glow: 'rgba(16,185,129,0.15)', seat: '#334155' },
    shoulders: { stroke: '#EC4899', glow: 'rgba(236,72,153,0.15)', seat: '#334155' },
    arms: { stroke: '#A855F7', glow: 'rgba(168,85,247,0.15)', seat: '#334155' },
    general: { stroke: '#F59E0B', glow: 'rgba(245,158,11,0.15)', seat: '#334155' },
    cardio: { stroke: '#EF4444', glow: 'rgba(239,68,68,0.15)', seat: '#334155' },
  };

  const accent = categoryAccent[category] || categoryAccent.general;

  // 1. Leg press horizontal (completamente horizontal, sem a rampa de 45°)
  if (id === 'std_legs_leg_press_horizontal') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_leg_press_horizontal" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Trilho horizontal e base */}
        <line x1="16" y1="68" x2="104" y2="68" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        <line x1="22" y1="74" x2="98" y2="74" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
        {/* Torre de peso traseira */}
        <rect x="14" y="24" width="14" height="44" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <line x1="17" y1="36" x2="25" y2="36" stroke="#64748B" strokeWidth="1" />
        <line x1="17" y1="48" x2="25" y2="48" stroke="#64748B" strokeWidth="1" />
        {/* Plataforma frontal vertical para os pés */}
        <rect x="88" y="28" width="6" height="38" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
        {/* Trenó deslizante com assento horizontal e encosto */}
        <rect x="38" y="58" width="30" height="7" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="36" y1="62" x2="30" y2="34" stroke={accent.seat} strokeWidth="7" strokeLinecap="round" />
        {/* Guia de deslocamento horizontal */}
        <line x1="68" y1="61" x2="88" y2="61" stroke={accent.stroke} strokeWidth="2" strokeDasharray="3 3" />
        <circle cx="53" cy="61" r="3.5" fill={accent.stroke} />
      </svg>
    );
  }

  // 2. Panturrilha sentada (com apoio almofadado sobre os joelhos e degrau frontal)
  if (id === 'std_legs_panturrilha_sentada') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_panturrilha_sentada" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="20" y1="76" x2="100" y2="76" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        {/* Banco assento pequeno */}
        <rect x="24" y="52" width="22" height="7" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="35" y1="59" x2="35" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Degrau para a ponta dos pés */}
        <rect x="76" y="70" width="16" height="6" rx="1.5" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        {/* Braço articulado com almofada sobre os joelhos */}
        <line x1="42" y1="56" x2="78" y2="40" stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="68" y="34" width="20" height="8" rx="3" fill={accent.stroke} />
        {/* Alavanca de trava manual */}
        <line x1="84" y1="36" x2="90" y2="24" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="90" cy="23" r="2.5" fill="#EF4444" />
      </svg>
    );
  }

  // 3. Panturrilha em pé (almofadas de ombros elevadas e degrau inferior)
  if (id === 'std_legs_panturrilha_em_pe') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_panturrilha_em_pe" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Coluna de carga e guias verticais */}
        <rect x="18" y="16" width="16" height="62" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <line x1="58" y1="16" x2="58" y2="74" stroke="#94A3B8" strokeWidth="3.5" />
        {/* Ombreiras acolchoadas superiores */}
        <rect x="46" y="24" width="24" height="8" rx="2.5" fill={accent.stroke} />
        <line x1="46" y1="28" x2="40" y2="34" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="28" x2="76" y2="34" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        {/* Bloco de degrau elevado para calcanhares */}
        <rect x="48" y="68" width="20" height="8" rx="2" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
        <line x1="34" y1="76" x2="82" y2="76" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 4. Glute drive (elevação pélvica em máquina com cinto e apoio dorsal pivotante)
  if (id === 'std_legs_glute_drive') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_glute_drive" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="16" y1="74" x2="104" y2="74" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        {/* Encosto superior articulado para a parte superior das costas */}
        <rect x="22" y="44" width="22" height="10" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="33" y1="54" x2="33" y2="74" stroke="#94A3B8" strokeWidth="3" />
        {/* Plataforma angular de pés */}
        <line x1="74" y1="73" x2="92" y2="60" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" />
        {/* Braço articulado do quadril com rolete/cinto sobre o púbis */}
        <path d="M38 52 C52 52, 56 46, 64 46" stroke="#94A3B8" strokeWidth="3" fill="none" />
        <rect x="52" y="41" width="16" height="8" rx="3" fill={accent.stroke} stroke="#CBD5E1" strokeWidth="1" />
        <circle cx="60" cy="45" r="2.5" fill="#FFFFFF" />
      </svg>
    );
  }

  // 5. Máquina de glúteo (coice / extensão traseira com pedal)
  if (id === 'std_legs_maquina_gluteo') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_maquina_gluteo" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Torre de peso */}
        <rect x="14" y="20" width="16" height="56" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        {/* Apoio de cotovelos e peito */}
        <rect x="36" y="40" width="18" height="8" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="45" y1="48" x2="45" y2="74" stroke="#94A3B8" strokeWidth="3" />
        {/* Braço pendular traseiro com pedal de empurrar com calcanhar */}
        <circle cx="58" cy="50" r="4" fill="#CBD5E1" />
        <line x1="58" y1="50" x2="88" y2="40" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <rect x="86" y="34" width="6" height="14" rx="2" fill="#E2E8F0" stroke={accent.stroke} strokeWidth="1.5" />
        <line x1="28" y1="74" x2="94" y2="74" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // 6. Desenvolvimento máquina (ombros - empurrar acima da cabeça)
  if (id === 'std_shoulders_desenvolvimento_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_desenvolvimento_maquina" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="18" width="16" height="60" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        {/* Assento e encosto vertical */}
        <rect x="52" y="48" width="18" height="22" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="61" y1="70" x2="61" y2="78" stroke="#94A3B8" strokeWidth="3" />
        {/* Manoplas erguidas acima da cabeça */}
        <path d="M44 42 L44 24 L52 24" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M78 42 L78 24 L70 24" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
        <rect x="48" y="21" width="6" height="6" rx="1.5" fill="#E2E8F0" />
        <rect x="66" y="21" width="6" height="6" rx="1.5" fill="#E2E8F0" />
        {/* Setas de impulso vertical */}
        <path d="M51 15 L51 11 M48 13 L51 10 L54 13" stroke={accent.stroke} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M69 15 L69 11 M66 13 L69 10 L72 13" stroke={accent.stroke} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 7a. Elevação lateral máquina (almofadas laterais para antebraços/cotovelos)
  if (id === 'std_shoulders_elevacao_lateral_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_elevacao_lateral_maquina" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="22" width="16" height="54" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        {/* Assento central */}
        <rect x="52" y="46" width="16" height="20" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="60" y1="66" x2="60" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Alavancas curvas externas com almofadas laterais */}
        <path d="M38 48 C36 34, 46 30, 52 32" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
        <path d="M82 48 C84 34, 74 30, 68 32" stroke="#94A3B8" strokeWidth="2.5" fill="none" />
        <rect x="34" y="40" width="8" height="16" rx="2.5" fill={accent.stroke} />
        <rect x="78" y="40" width="8" height="16" rx="2.5" fill={accent.stroke} />
      </svg>
    );
  }

  // 7b. Máquina de elevação lateral (came superior duplo e braços pivotantes de abdução)
  if (id === 'std_shoulders_maquina_elevacao_lateral') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_maquina_elevacao_lateral" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="18" width="16" height="58" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <circle cx="60" cy="24" r="6" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
        <rect x="52" y="48" width="16" height="20" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="60" y1="68" x2="60" y2="76" stroke="#94A3B8" strokeWidth="3" />
        <path d="M54 24 L38 42 L38 54" stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M66 24 L82 42 L82 54" stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="33" y="42" width="9" height="14" rx="2.5" fill={accent.stroke} />
        <rect x="78" y="42" width="9" height="14" rx="2.5" fill={accent.stroke} />
      </svg>
    );
  }

  // 8. Banco para desenvolvimento (encosto 85-90° quase vertical)
  if (id === 'std_shoulders_banco_desenvolvimento') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_banco_desenvolvimento" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Base de aço reforçada */}
        <line x1="22" y1="76" x2="98" y2="76" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="34" y1="64" x2="34" y2="76" stroke="#94A3B8" strokeWidth="3" />
        <line x1="78" y1="64" x2="78" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Assento horizontal baixo */}
        <rect x="36" y="60" width="30" height="7" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        {/* Encosto quase vertical (85°) */}
        <line x1="42" y1="61" x2="45" y2="18" stroke={accent.seat} strokeWidth="8" strokeLinecap="round" />
        <line x1="42" y1="61" x2="45" y2="18" stroke={accent.stroke} strokeWidth="1.5" strokeLinecap="round" />
        {/* Suporte traseiro rígido de coluna */}
        <line x1="38" y1="62" x2="38" y2="28" stroke="#CBD5E1" strokeWidth="3" />
      </svg>
    );
  }

  // 9. Máquina de tríceps (mergulho / pushdown sentado)
  if (id === 'std_arms_maquina_triceps') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_maquina_triceps" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="20" width="16" height="58" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        {/* Assento e encosto */}
        <rect x="52" y="46" width="18" height="20" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="61" y1="66" x2="61" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Alavancas de empurrar para baixo (dip machine) */}
        <path d="M42 36 L42 56 L48 56" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M80 36 L80 56 L74 56" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="42" cy="36" r="3" fill="#CBD5E1" />
        <circle cx="80" cy="36" r="3" fill="#CBD5E1" />
        {/* Manoplas almofadadas de pressão para baixo */}
        <rect x="40" y="53" width="8" height="5" rx="1.5" fill="#E2E8F0" />
        <rect x="72" y="53" width="8" height="5" rx="1.5" fill="#E2E8F0" />
      </svg>
    );
  }

  // 10. Barras e puxadores de polia (corda, barra reta, triângulo e estribo)
  if (id === 'std_arms_barras_puxadores_polia') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_barras_puxadores_polia" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Corda de tríceps em V com pontas emborrachadas */}
        <path d="M26 58 C32 46, 38 32, 44 26 C50 32, 56 46, 62 58" stroke="#E2E8F0" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="58" r="4.5" fill={accent.stroke} />
        <circle cx="62" cy="58" r="4.5" fill={accent.stroke} />
        <circle cx="44" cy="24" r="3" fill="#94A3B8" />
        {/* Triângulo de remada / puxador V */}
        <polygon points="84,24 74,48 94,48" stroke="#CBD5E1" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        <line x1="70" y1="48" x2="98" y2="48" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" />
        {/* Barra reta curta de polia */}
        <line x1="30" y1="74" x2="90" y2="74" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="74" r="3" fill={accent.stroke} />
      </svg>
    );
  }

  // 11. Barras retas (barra olímpica longa e barras de peso livre)
  if (id === 'std_general_barras_retas') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_barras_retas" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Barra longa central */}
        <line x1="12" y1="45" x2="108" y2="45" stroke="#CBD5E1" strokeWidth="3.5" strokeLinecap="round" />
        {/* Mangas olímpicas com anéis de batente */}
        <rect x="14" y="40" width="18" height="10" rx="1.5" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="88" y="40" width="18" height="10" rx="1.5" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="32" y1="38" x2="32" y2="52" stroke={accent.stroke} strokeWidth="2.5" />
        <line x1="88" y1="38" x2="88" y2="52" stroke={accent.stroke} strokeWidth="2.5" />
        {/* Recartilhado central com textura */}
        <line x1="44" y1="43" x2="54" y2="43" stroke="#64748B" strokeWidth="1" />
        <line x1="66" y1="43" x2="76" y2="43" stroke="#64748B" strokeWidth="1" />
      </svg>
    );
  }

  // 12. Barras W (formato ondulado anatômico com mangas)
  if (id === 'std_general_barras_w') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_barras_w" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mangas laterais */}
        <rect x="14" y="40" width="16" height="10" rx="1.5" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="90" y="40" width="16" height="10" rx="1.5" fill="#94A3B8" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="30" y1="38" x2="30" y2="52" stroke={accent.stroke} strokeWidth="2" />
        <line x1="90" y1="38" x2="90" y2="52" stroke={accent.stroke} strokeWidth="2" />
        {/* Traçado ondulado em formato W */}
        <path
          d="M30 45 L42 45 L50 36 L60 52 L70 36 L78 45 L90 45"
          stroke="#F8FAFC"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Destaque recartilhado nas curvas de pegada */}
        <line x1="47" y1="39" x2="53" y2="47" stroke={accent.stroke} strokeWidth="2" />
        <line x1="67" y1="47" x2="73" y2="39" stroke={accent.stroke} strokeWidth="2" />
      </svg>
    );
  }

  // 13. Bancos reguláveis (com arco de ajuste de múltiplos ângulos e pino)
  if (id === 'std_general_bancos_regulaveis') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_bancos_regulaveis" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="18" y1="76" x2="102" y2="76" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="62" x2="28" y2="76" stroke="#94A3B8" strokeWidth="3" />
        <line x1="88" y1="62" x2="88" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Assento regulável */}
        <line x1="22" y1="64" x2="44" y2="60" stroke={accent.seat} strokeWidth="7" strokeLinecap="round" />
        {/* Encosto inclinado demonstrando a articulação móvel */}
        <line x1="45" y1="58" x2="86" y2="26" stroke={accent.seat} strokeWidth="8" strokeLinecap="round" />
        <line x1="45" y1="58" x2="86" y2="26" stroke={accent.stroke} strokeWidth="1.5" strokeLinecap="round" />
        {/* Arco dentado / seletor de graus */}
        <path d="M54 62 C64 56, 72 48, 76 38" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="2 2" fill="none" />
        <circle cx="68" cy="46" r="3" fill="#EF4444" />
      </svg>
    );
  }

  // 14. Colchonetes (tapetes de solo acolchoados com ilhós de suspensão)
  if (id === 'std_general_colchonetes') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_colchonetes" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Colchonete inferior */}
        <rect x="20" y="52" width="80" height="12" rx="3" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="22" y1="58" x2="98" y2="58" stroke="#475569" strokeWidth="1" />
        {/* Colchonete superior ligeiramente desalinhado */}
        <rect x="24" y="36" width="76" height="12" rx="3" fill={accent.stroke} stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="26" y1="42" x2="98" y2="42" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
        {/* Ilhoses de suspensão na ponta */}
        <circle cx="30" cy="42" r="2.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1" />
        <circle cx="38" cy="42" r="2.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1" />
      </svg>
    );
  }

  // 15. Elásticos de resistência (mini bands e super bands circulares)
  if (id === 'std_general_elasticos_resistencia') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_elasticos_resistencia" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Faixa elástica elíptica maior (super band) */}
        <ellipse cx="60" cy="45" rx="42" ry="22" stroke={accent.stroke} strokeWidth="5" fill="none" strokeDasharray="90 8" />
        {/* Faixa elástica média interior */}
        <ellipse cx="60" cy="45" rx="32" ry="16" stroke="#06B6D4" strokeWidth="4" fill="none" />
        {/* Mini band compacta interior */}
        <ellipse cx="60" cy="45" rx="20" ry="10" stroke="#10B981" strokeWidth="3" fill="none" />
      </svg>
    );
  }

  // 16. Supino máquina sentado (específico)
  if (id === 'std_chest_supino_maquina') {
    return (
      <svg data-render-mode="specific" data-template-id="svg_specific_supino_maquina" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="20" width="16" height="58" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <rect x="52" y="44" width="18" height="22" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="61" y1="66" x2="61" y2="76" stroke="#94A3B8" strokeWidth="3" />
        {/* Braços de empurrar para frente */}
        <line x1="54" y1="46" x2="78" y2="46" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="78" cy="46" r="3.5" fill="#E2E8F0" />
      </svg>
    );
  }

  // --- Ilustrações compartilhadas por famílias mecânicas ---

  // Família 1: Supino reto e bancos retos gerais
  if (id.includes('supino_reto') || id === 'std_general_bancos_retos') {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_supino_reto_banco" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="52" width="90" height="9" rx="3" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="28" y1="61" x2="28" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <line x1="92" y1="61" x2="92" y2="78" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="78" x2="36" y2="78" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="84" y1="78" x2="100" y2="78" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
        {/* Rack vertical e barra */}
        <line x1="88" y1="20" x2="88" y2="61" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <path d="M83 26 L88 30 L93 26" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="28" x2="114" y2="28" stroke="#F1F5F9" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="58" y="22" width="5" height="12" rx="1.5" fill={accent.stroke} />
        <rect x="101" y="22" width="5" height="12" rx="1.5" fill={accent.stroke} />
      </svg>
    );
  }

  // Família 2: Peck deck / Crucifixo máquina
  if (id.includes('peck_deck') || id.includes('crucifixo_maquina')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_peck_deck_crucifixo" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="15" width="22" height="60" rx="3" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <line x1="28" y1="30" x2="44" y2="30" stroke="#64748B" strokeWidth="1" />
        <line x1="28" y1="42" x2="44" y2="42" stroke="#64748B" strokeWidth="1" />
        <line x1="28" y1="54" x2="44" y2="54" stroke="#64748B" strokeWidth="1" />
        <rect x="58" y="44" width="18" height="26" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <rect x="58" y="68" width="18" height="6" rx="1.5" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        {/* Alavancas verticais */}
        <path d="M52 24 C52 42, 60 52, 65 52" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" />
        <path d="M82 24 C82 42, 74 52, 69 52" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" />
        <rect x="49" y="30" width="6" height="18" rx="2" fill="#E2E8F0" />
        <rect x="79" y="30" width="6" height="18" rx="2" fill="#E2E8F0" />
      </svg>
    );
  }

  // Família 3: Crossover / Polias ajustáveis
  if (id.includes('crossover') || id.includes('polias_ajustaveis')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_crossover_polias" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="16" height="62" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <rect x="92" y="16" width="16" height="62" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <path d="M20 22 C40 14, 80 14, 100 22" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="32" r="3.5" fill={accent.stroke} />
        <circle cx="100" cy="32" r="3.5" fill={accent.stroke} />
        <line x1="20" y1="32" x2="48" y2="52" stroke={accent.stroke} strokeWidth="2" strokeDasharray="2 2" />
        <line x1="100" y1="32" x2="72" y2="52" stroke={accent.stroke} strokeWidth="2" strokeDasharray="2 2" />
        <circle cx="48" cy="52" r="3" fill="#CBD5E1" />
        <circle cx="72" cy="52" r="3" fill="#CBD5E1" />
      </svg>
    );
  }

  // Família 4: Puxada alta / Graviton / Pulldown
  if (id.includes('puxada_alta') || id.includes('pulldown') || id.includes('graviton')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_puxada_vertical" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="18" width="18" height="60" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <path d="M28 20 L28 14 L75 14 L75 22" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="75" cy="22" r="3" fill="#E2E8F0" />
        <line x1="50" y1="28" x2="100" y2="28" stroke={accent.stroke} strokeWidth="3.5" strokeLinecap="round" />
        <line x1="75" y1="22" x2="75" y2="28" stroke="#CBD5E1" strokeWidth="1.5" />
        <rect x="65" y="48" width="20" height="20" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <circle cx="75" cy="42" r="4.5" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" />
        <line x1="75" y1="68" x2="75" y2="80" stroke="#94A3B8" strokeWidth="3" />
      </svg>
    );
  }

  // Família 5: Remadas (baixa, articulada, cavalinho)
  if (id.includes('remada_baixa') || id.includes('remada_articulada') || id.includes('remada_cavalinho')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_remada_horizontal" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="24" width="16" height="52" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <rect x="52" y="58" width="36" height="8" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="60" y1="66" x2="60" y2="78" stroke="#94A3B8" strokeWidth="3" />
        <line x1="82" y1="66" x2="82" y2="78" stroke="#94A3B8" strokeWidth="3" />
        <line x1="42" y1="52" x2="42" y2="68" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="26" y1="58" x2="56" y2="52" stroke={accent.stroke} strokeWidth="2" strokeDasharray="3 2" />
        <polygon points="56,48 64,52 56,56" fill={accent.stroke} />
      </svg>
    );
  }

  // Família 6: Leg press 45° e Hack squat
  if (id.includes('leg_press_45') || id.includes('hack_squat')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_leg_press_45_hack" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="24" y1="76" x2="94" y2="18" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        <line x1="32" y1="80" x2="102" y2="22" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
        <polygon points="52,48 70,33 76,40 58,55" fill={accent.stroke} />
        <line x1="84" y1="14" x2="106" y2="34" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="20" y1="78" x2="48" y2="56" stroke={accent.seat} strokeWidth="8" strokeLinecap="round" />
        <rect x="56" y="26" width="12" height="6" rx="1.5" fill="#94A3B8" transform="rotate(-38 56 26)" />
      </svg>
    );
  }

  // Família 7: Extensora e flexora
  if (id.includes('extensora') || id.includes('flexora')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_extensora_flexora" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="20" width="18" height="58" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <rect x="52" y="46" width="22" height="18" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <rect x="70" y="32" width="6" height="24" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="62" y1="64" x2="62" y2="78" stroke="#94A3B8" strokeWidth="3" />
        <circle cx="56" cy="48" r="4.5" fill="#CBD5E1" stroke={accent.stroke} strokeWidth="2" />
        <line x1="56" y1="48" x2="44" y2="68" stroke={accent.stroke} strokeWidth="3" strokeLinecap="round" />
        <circle cx="44" cy="68" r="5" fill="#64748B" stroke="#CBD5E1" strokeWidth="2" />
      </svg>
    );
  }

  // Família 8: Abdutora e adutora
  if (id.includes('abdutora') || id.includes('adutora')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_abdutora_adutora" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="18" height="58" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="2" />
        <rect x="54" y="44" width="24" height="20" rx="3" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <rect x="62" y="26" width="8" height="20" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <circle cx="50" cy="56" r="6" fill="#475569" stroke={accent.stroke} strokeWidth="2" />
        <circle cx="82" cy="56" r="6" fill="#475569" stroke={accent.stroke} strokeWidth="2" />
      </svg>
    );
  }

  // Família 9: Smith e racks de agachamento / barra fixa
  if (
    id.includes('smith') ||
    id.includes('rack_agachamento') ||
    id.includes('agachamento_livre') ||
    id.includes('barra_fixa')
  ) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_rack_smith_barra_fixa" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="30" y1="16" x2="30" y2="78" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
        <line x1="90" y1="16" x2="90" y2="78" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
        <line x1="24" y1="18" x2="96" y2="18" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
        <line x1="22" y1="78" x2="38" y2="78" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="82" y1="78" x2="98" y2="78" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <line x1="18" y1="42" x2="102" y2="42" stroke="#F8FAFC" strokeWidth="3.5" strokeLinecap="round" />
        <rect x="27" y="38" width="6" height="8" rx="1.5" fill={accent.stroke} />
        <rect x="87" y="38" width="6" height="8" rx="1.5" fill={accent.stroke} />
      </svg>
    );
  }

  // Família 10: Scott e bíceps
  if (id.includes('scott') || id.includes('biceps')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_scott_biceps" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="36" y1="46" x2="68" y2="34" stroke={accent.seat} strokeWidth="10" strokeLinecap="round" />
        <rect x="22" y="60" width="18" height="6" rx="2" fill={accent.seat} stroke="#64748B" strokeWidth="1.5" />
        <line x1="30" y1="66" x2="30" y2="78" stroke="#94A3B8" strokeWidth="3" />
        <line x1="56" y1="44" x2="56" y2="78" stroke="#94A3B8" strokeWidth="3" />
        <path d="M72 32 L72 38 L76 38" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M66 32 Q 74 36 78 30 T 90 32" stroke={accent.stroke} strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // Família 11: Halteres / Kettlebells / Anilhas
  if (id.includes('halteres') || id.includes('kettlebells') || id.includes('anilhas')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_pesos_livres" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="28" y="32" width="10" height="26" rx="3" fill={accent.stroke} />
        <rect x="22" y="35" width="8" height="20" rx="2.5" fill="#64748B" />
        <rect x="36" y="42" width="48" height="6" rx="2" fill="#E2E8F0" />
        <rect x="82" y="32" width="10" height="26" rx="3" fill={accent.stroke} />
        <rect x="90" y="35" width="8" height="20" rx="2.5" fill="#64748B" />
        <line x1="54" y1="41" x2="54" y2="49" stroke="#94A3B8" strokeWidth="1" />
        <line x1="58" y1="41" x2="58" y2="49" stroke="#94A3B8" strokeWidth="1" />
        <line x1="62" y1="41" x2="62" y2="49" stroke="#94A3B8" strokeWidth="1" />
        <line x1="66" y1="41" x2="66" y2="49" stroke="#94A3B8" strokeWidth="1" />
      </svg>
    );
  }

  // Família 12: Cardio Bicicleta / Spinning
  if (id.includes('bicicleta') || id.includes('spinning')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_bicicleta_spinning" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="62" r="16" stroke="#475569" strokeWidth="3" fill="#1E293B" />
        <circle cx="84" cy="62" r="16" stroke={accent.stroke} strokeWidth="4" fill="#0F172A" />
        <path d="M36 62 L58 40 L84 62 L58 62 Z" stroke="#94A3B8" strokeWidth="3" fill="none" strokeLinejoin="round" />
        <line x1="58" y1="40" x2="50" y2="30" stroke="#CBD5E1" strokeWidth="3" />
        <rect x="42" y="27" width="16" height="4" rx="2" fill={accent.seat} />
        <line x1="84" y1="62" x2="74" y2="26" stroke="#CBD5E1" strokeWidth="3" />
        <path d="M68 24 L74 24 L78 28" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // Família 13: Cardio Elíptico / Simulador de escada
  if (id.includes('eliptico') || id.includes('escada')) {
    return (
      <svg data-render-mode="shared" data-template-id="svg_shared_eliptico_escada" viewBox="0 0 120 90" className="w-full h-full p-2" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="22" y1="74" x2="98" y2="74" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
        <rect x="30" y="56" width="18" height="6" rx="2" fill={accent.seat} stroke={accent.stroke} strokeWidth="1.5" />
        <rect x="52" y="44" width="18" height="6" rx="2" fill={accent.seat} stroke={accent.stroke} strokeWidth="1.5" />
        <rect x="74" y="32" width="18" height="6" rx="2" fill={accent.seat} stroke={accent.stroke} strokeWidth="1.5" />
        <path d="M38 56 L38 28 L88 20 L88 32" stroke="#CBD5E1" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // Fallback com placeholder nominal estrito (não reaproveita desenho de outro aparelho)
  return (
    <div
      data-render-mode="placeholder"
      data-template-id="placeholder_nominal"
      className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-1">
        <Dumbbell className="w-4 h-4" style={{ color: accent.stroke }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[90%]">
        {name || id}
      </span>
      <span className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">
        Equipamento
      </span>
    </div>
  );
};

/**
 * Lista oficial dos equipamentos priorizados que possuem ilustração SVG específica exclusiva.
 */
export const PRIORITIZED_EQUIPMENT_IDS: readonly string[] = [
  'std_legs_leg_press_horizontal',
  'std_legs_panturrilha_sentada',
  'std_legs_panturrilha_em_pe',
  'std_legs_glute_drive',
  'std_legs_maquina_gluteo',
  'std_shoulders_desenvolvimento_maquina',
  'std_shoulders_elevacao_lateral_maquina',
  'std_shoulders_maquina_elevacao_lateral',
  'std_shoulders_banco_desenvolvimento',
  'std_arms_maquina_triceps',
  'std_arms_barras_puxadores_polia',
  'std_general_barras_retas',
  'std_general_barras_w',
  'std_general_bancos_regulaveis',
  'std_general_colchonetes',
  'std_general_elasticos_resistencia',
];

export interface EquipmentIllustrationClassification {
  id: string;
  renderMode: 'specific' | 'shared' | 'placeholder';
  templateId: string;
  isPrioritized: boolean;
  placeholderLabel: string | null;
}

/**
 * Classifica de forma determinística e 100% fiel às condições de StandardEquipmentSvg
 * como cada equipamento é renderizado:
 * - 'specific': Ilustração SVG exclusiva para aquele equipamento específico (17 equipamentos).
 * - 'shared': Ilustração SVG compartilhada entre aparelhos da mesma família mecânica (33 equipamentos).
 * - 'placeholder': Placeholder nominal que exibe o nome exato do equipamento (4 equipamentos do catálogo padrão).
 */
export function classifyEquipmentIllustration(
  id: string,
  name?: string
): EquipmentIllustrationClassification {
  const isPrioritized = PRIORITIZED_EQUIPMENT_IDS.includes(id);

  // 1. Ilustrações SVG específicas (exatamente as 17 condições `id === '...'` de StandardEquipmentSvg)
  const specificMap: Record<string, string> = {
    std_legs_leg_press_horizontal: 'svg_specific_leg_press_horizontal',
    std_legs_panturrilha_sentada: 'svg_specific_panturrilha_sentada',
    std_legs_panturrilha_em_pe: 'svg_specific_panturrilha_em_pe',
    std_legs_glute_drive: 'svg_specific_glute_drive',
    std_legs_maquina_gluteo: 'svg_specific_maquina_gluteo',
    std_shoulders_desenvolvimento_maquina: 'svg_specific_desenvolvimento_maquina',
    std_shoulders_elevacao_lateral_maquina: 'svg_specific_elevacao_lateral_maquina',
    std_shoulders_maquina_elevacao_lateral: 'svg_specific_maquina_elevacao_lateral',
    std_shoulders_banco_desenvolvimento: 'svg_specific_banco_desenvolvimento',
    std_arms_maquina_triceps: 'svg_specific_maquina_triceps',
    std_arms_barras_puxadores_polia: 'svg_specific_barras_puxadores_polia',
    std_general_barras_retas: 'svg_specific_barras_retas',
    std_general_barras_w: 'svg_specific_barras_w',
    std_general_bancos_regulaveis: 'svg_specific_bancos_regulaveis',
    std_general_colchonetes: 'svg_specific_colchonetes',
    std_general_elasticos_resistencia: 'svg_specific_elasticos_resistencia',
    std_chest_supino_maquina: 'svg_specific_supino_maquina',
  };

  if (id in specificMap) {
    return {
      id,
      renderMode: 'specific',
      templateId: specificMap[id],
      isPrioritized,
      placeholderLabel: null,
    };
  }

  // 2. Ilustrações SVG compartilhadas por família mecânica (exatamente as 13 condições de StandardEquipmentSvg)
  if (id.includes('supino_reto') || id === 'std_general_bancos_retos') {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_supino_reto_banco',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('peck_deck') || id.includes('crucifixo_maquina')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_peck_deck_crucifixo',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('crossover') || id.includes('polias_ajustaveis')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_crossover_polias',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('puxada_alta') || id.includes('pulldown') || id.includes('graviton')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_puxada_vertical',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (
    id.includes('remada_baixa') ||
    id.includes('remada_articulada') ||
    id.includes('remada_cavalinho')
  ) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_remada_horizontal',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('leg_press_45') || id.includes('hack_squat')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_leg_press_45_hack',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('extensora') || id.includes('flexora')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_extensora_flexora',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('abdutora') || id.includes('adutora')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_abdutora_adutora',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (
    id.includes('smith') ||
    id.includes('rack_agachamento') ||
    id.includes('agachamento_livre') ||
    id.includes('barra_fixa')
  ) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_rack_smith_barra_fixa',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('scott') || id.includes('biceps')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_scott_biceps',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('halteres') || id.includes('kettlebells') || id.includes('anilhas')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_pesos_livres',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('bicicleta') || id.includes('spinning')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_bicicleta_spinning',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }
  if (id.includes('eliptico') || id.includes('escada')) {
    return {
      id,
      renderMode: 'shared',
      templateId: 'svg_shared_eliptico_escada',
      isPrioritized: false,
      placeholderLabel: null,
    };
  }

  // 3. Placeholder nominal estrito (exibe o nome exato do equipamento)
  return {
    id,
    renderMode: 'placeholder',
    templateId: 'placeholder_nominal',
    isPrioritized: false,
    placeholderLabel: name || id,
  };
}


