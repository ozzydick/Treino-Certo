/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ClipboardList,
  Dumbbell,
  Flame,
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { NavigationTab } from '../../types';

interface Props {
  tab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  onOpenThemeModal: () => void;
  onOpenEquipments?: () => void;
}

const SECTION_CONFIG: Record<
  string,
  {
    title: string;
    subtitle: string;
    checkpoint: string;
    checkpointNumber: string;
    description: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    features: string[];
  }
> = {
  plan: {
    title: 'Minha Ficha de Treino',
    subtitle: 'Prescrição digital do seu instrutor de academia',
    checkpoint: 'CHECKPOINT 04',
    checkpointNumber: '04',
    icon: ClipboardList,
    description:
      'Espaço dedicado para cadastrar sua ficha física prescrita pelo instrutor da academia, organizar divisões (Treino A, B, C, D), configurar séries, repetições, intervalos e versionamento histórico.',
    features: [
      'Divisões personalizadas (Treino A, Treino B, Treino C, etc.)',
      'Configuração fiel de séries, repetições prescritas e intervalos',
      'Versionamento histórico de fichas sem sobrescrever dados antigos',
      'Modo Treino guiado para execução presencial na academia',
    ],
  },
  exercises: {
    title: 'Biblioteca de Exercícios',
    subtitle: 'Instruções biomecânicas e vídeos externos',
    checkpoint: 'CHECKPOINT 03',
    checkpointNumber: '03',
    icon: Dumbbell,
    description:
      'Catálogo estruturado de exercícios com orientações técnicas numeradas, grupo muscular principal e secundário, respiração correta, erros comuns e link para vídeos demonstrativos.',
    features: [
      'Instruções passo a passo de posicionamento e execução',
      'Grupos musculares principais e secundários mapeados',
      'Orientações de respiração e prevenção de lesões',
      'Compatibilidade direta com o catálogo de equipamentos da academia',
    ],
  },
  cardio: {
    title: 'Módulo de Cardio',
    subtitle: 'Esteira, bicicleta, spinning, elíptico e escada',
    checkpoint: 'CHECKPOINT 06',
    checkpointNumber: '06',
    icon: Flame,
    description:
      'Acompanhamento independente de sessões cardiovasculares, cronômetro em tempo real, registros de tempo, distância, velocidade, inclinação e treinamento intervalado configurável.',
    features: [
      'Registro independente para esteira, bike, elíptico e escada',
      'Cronômetro de treino em tempo real',
      'Configuração de treinos intervalados (caminhada e corrida)',
      'Histórico de ritmo e evolução cardiovascular',
    ],
  },
};

export const SectionPlaceholder: React.FC<Props> = ({
  tab,
  onNavigate,
  onOpenThemeModal,
  onOpenEquipments,
}) => {
  const { themeConfig } = useTheme();
  const config = SECTION_CONFIG[tab] || {
    title: 'Módulo em Desenvolvimento',
    subtitle: 'Estrutura preparada para a próxima etapa',
    checkpoint: 'CHECKPOINT EM BREVE',
    checkpointNumber: '—',
    icon: Dumbbell,
    description: 'Este módulo será construído logo após a validação do Checkpoint 01.',
    features: [],
  };

  const Icon = config.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6 animate-in fade-in duration-200">
      {/* Main Status Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden text-center space-y-5">
        {/* Glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeConfig.primaryHex }}
        />

        {/* Icon Badge */}
        <div className="relative z-10 inline-flex flex-col items-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl mb-3"
            style={{
              backgroundColor: `rgba(${themeConfig.rgb}, 0.15)`,
              borderColor: `rgba(${themeConfig.rgb}, 0.35)`,
            }}
          >
            <Icon className="w-8 h-8" style={{ color: themeConfig.primaryHex }} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated border border-white/10 text-[11px] font-bold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-primary-app" />
            <span>Aguardando Validação do Checkpoint 01</span>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white">{config.title}</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{config.subtitle}</p>
        </div>

        {/* Description */}
        <p className="relative z-10 text-xs text-slate-300 leading-relaxed max-w-lg mx-auto bg-surface-elevated p-4 rounded-2xl border border-white/5">
          {config.description}
        </p>

        {/* Features preview */}
        <div className="relative z-10 text-left bg-[#0A0E13] p-4 rounded-2xl border border-white/5 space-y-2.5 max-w-lg mx-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            Planejamento de Recursos ({config.checkpoint}):
          </span>
          {config.features.map((feat, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs text-slate-300">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: themeConfig.primaryHex }}
              />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Guideline reminder */}
        <div className="relative z-10 p-3.5 rounded-2xl bg-surface-elevated border border-white/10 text-xs text-slate-300 text-left flex items-start gap-2.5 max-w-lg mx-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>Checkpoint 02 ativo:</strong> O catálogo de equipamentos e seleção da academia foi liberado. A biblioteca de exercícios será implementada no Checkpoint 03 após validação.
          </span>
        </div>

        {/* Quick action back to Home or Profile */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {tab === 'exercises' && onOpenEquipments && (
            <button
              onClick={onOpenEquipments}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: themeConfig.primaryHex,
                boxShadow: `0 3px 15px rgba(${themeConfig.rgb}, 0.3)`,
              }}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Configurar Equipamentos da Academia</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('home')}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
              tab === 'exercises'
                ? 'bg-surface-elevated border border-white/10 hover:border-primary-app text-white'
                : 'text-black'
            }`}
            style={
              tab !== 'exercises'
                ? {
                    backgroundColor: themeConfig.primaryHex,
                    boxShadow: `0 3px 15px rgba(${themeConfig.rgb}, 0.3)`,
                  }
                : undefined
            }
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition"
          >
            Ver Perfil & Temas
          </button>
        </div>
      </div>
    </div>
  );
};
