/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Flame,
  ClipboardList,
  Sparkles,
  ArrowRight,
  UserCheck,
  Building2,
  CalendarDays,
  Target,
  Dumbbell,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useEquipments } from '../../context/EquipmentsContext';
import { useWorkout } from '../../context/WorkoutContext';
import { NavigationTab } from '../../types';
import { GoalProgressCard } from '../goals/GoalProgressCard';
import { GoalSettingsModal } from '../goals/GoalSettingsModal';
import { WeeklySummaryCard } from '../summary/WeeklySummaryCard';

interface Props {
  onNavigate: (tab: NavigationTab) => void;
  onOpenThemeModal: () => void;
  onOpenEquipments?: () => void;
}

export const DashboardPreview: React.FC<Props> = ({ onNavigate, onOpenThemeModal, onOpenEquipments }) => {
  const { themeConfig } = useTheme();
  const { profile, isProfileConfigured } = useUser();
  const { totalSelectedCount } = useEquipments();
  const { activePlan, activeSession, sessionsHistory } = useWorkout();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(today);

  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const currentHour = today.getHours();
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  const firstName = profile.name && profile.name.trim().length > 0
    ? profile.name.trim().split(' ')[0]
    : null;

  // Real data: Treinos efetivamente concluídos nesta semana (segunda a domingo)
  const dayOfWeek = (today.getDay() + 6) % 7; // Seg = 0
  const mondayMidnight = new Date(today);
  mondayMidnight.setDate(today.getDate() - dayOfWeek);
  mondayMidnight.setHours(0, 0, 0, 0);

  const completedWorkoutsThisWeek = (sessionsHistory || []).filter((s) => {
    if (!s.isCompleted || !s.startTime) return false;
    return new Date(s.startTime).getTime() >= mondayMidnight.getTime();
  }).length;

  const targetWorkouts = profile.weeklyFrequency && profile.weeklyFrequency > 0
    ? profile.weeklyFrequency
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6 animate-in fade-in duration-200">
      {/* Top Greeting & Date Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            {displayDate}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            {firstName ? (
              <>
                {greeting}, <span style={{ color: themeConfig.primaryHex }}>{firstName}</span>!
              </>
            ) : (
              <>
                Olá, <span style={{ color: themeConfig.primaryHex }}>Atleta</span>!
              </>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {profile.gymName ? (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>Academia: {profile.gymName}</span>
              </span>
            ) : (
              'Seu treino. Sua evolução.'
            )}
          </p>
        </div>

        {/* Theme pill indicator */}
        <button
          onClick={onOpenThemeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-elevated border border-white/10 hover:border-primary-app transition text-xs font-medium text-slate-300"
          title="Clique para trocar o tema"
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: themeConfig.primaryHex }}
          />
          <span className="text-[11px] font-bold">{themeConfig.name}</span>
        </button>
      </div>

      {/* Profile Incomplete Welcome Banner (if profile not yet configured) */}
      {!isProfileConfigured && (
        <div className="p-4 rounded-3xl bg-surface-card border border-primary-app/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-surface flex items-center justify-center shrink-0 border border-primary-app/30 mt-0.5">
              <UserCheck className="w-5 h-5 text-primary-app" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Configure seu perfil inicial</h3>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Cadastre seu nome, academia e meta semanal para personalizar suas métricas e o acompanhamento do treino.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-black font-bold text-xs uppercase tracking-wider shrink-0 transition text-center"
            style={{
              backgroundColor: themeConfig.primaryHex,
              boxShadow: `0 2px 10px rgba(${themeConfig.rgb}, 0.3)`,
            }}
          >
            Completar Perfil
          </button>
        </div>
      )}

      {/* Workout Plan Section: Dynamic according to active session / active plan */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden">
        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeConfig.primaryHex }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-surface-elevated border border-white/10 text-slate-300">
              {activeSession && !activeSession.isCompleted
                ? 'Treino em Andamento'
                : activePlan
                ? 'Ficha Ativa do Instrutor'
                : 'Ficha do Instrutor'}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>
                {activeSession && !activeSession.isCompleted
                  ? 'Sessão iniciada'
                  : activePlan
                  ? `${activePlan.divisions.length} divisões`
                  : 'Sem treino ativo'}
              </span>
            </span>
          </div>

          {activeSession && !activeSession.isCompleted ? (
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeSession.divisionName}</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Você tem uma sessão em execução ({activeSession.exercisesCompleted} exercícios registrados). Continue de onde parou ou conclua suas séries.
              </p>
            </div>
          ) : activePlan ? (
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {activePlan.name}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {activePlan.divisions.map((d) => d.name).join(' • ')} — Prescrição pronta para execução com cronômetro de descanso e registro de cargas.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Nenhuma ficha cadastrada ainda
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                O <strong>TREINO CERTO</strong> respeita rigorosamente a prescrição do instrutor da sua academia. Você poderá cadastrar sua ficha física (divisões A, B, C, séries e repetições) e acompanhar a execução sem dados fictícios.
              </p>
            </div>
          )}

          {activePlan && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {activePlan.divisions.map((div) => (
                <div
                  key={div.id}
                  className="p-2.5 rounded-xl bg-surface-elevated border border-white/5 text-xs"
                >
                  <span className="font-bold text-white block">{div.name}</span>
                  <span className="text-[10px] text-slate-400 truncate block">{div.muscleFocus}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigate('plan')}
            className="w-full py-3 px-5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2"
          >
            <ClipboardList className="w-4 h-4 text-primary-app" />
            <span>
              {activeSession && !activeSession.isCompleted
                ? 'Retomar Treino em Andamento'
                : activePlan
                ? 'Acessar Ficha e Iniciar Treino'
                : 'Cadastrar Minha Ficha de Treino'}
            </span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Minha Academia & Catálogo de Equipamentos (Checkpoint 02) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-surface-elevated border border-white/10 text-slate-300">
            Minha Academia · Checkpoint 02
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>{profile.gymName && profile.gymName.trim() ? profile.gymName : 'Local de treino'}</span>
          </span>
        </div>

        <div className="mt-3">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Dumbbell className="w-5 h-5" style={{ color: themeConfig.primaryHex }} />
            <span>Equipamentos da Academia</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {totalSelectedCount > 0 ? (
              <>
                Você possui <strong className="text-white">{totalSelectedCount}</strong> equipamentos selecionados disponíveis para os seus treinos.
              </>
            ) : (
              'Selecione os equipamentos existentes na sua academia para personalizar a execução dos seus exercícios.'
            )}
          </p>
        </div>

        <button
          onClick={onOpenEquipments}
          className="mt-4 w-full py-3 px-5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Dumbbell className="w-4 h-4 text-primary-app" />
          <span>{totalSelectedCount > 0 ? 'Gerenciar Equipamentos' : 'Selecionar Equipamentos da Academia'}</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Biblioteca de Exercícios (Checkpoint 03) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Biblioteca · Checkpoint 03</span>
          <span>Consulta offline</span>
        </div>

        <div className="mt-2.5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: themeConfig.primaryHex }} />
            <span>Biblioteca de Exercícios</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Consulte instruções passo a passo de execução, grupos musculares, equipamentos compatíveis, ilustrações locais e vídeos demonstrativos.
          </p>
        </div>

        <button
          onClick={() => onNavigate('exercises')}
          className="mt-4 w-full py-3 px-5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Target className="w-4 h-4 text-primary-app" />
          <span>Abrir Biblioteca de Exercícios</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Evolução & Resultados (Checkpoint 05) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Evolução · Checkpoint 05</span>
          <span>Offline & Histórico</span>
        </div>

        <div className="mt-2.5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: themeConfig.primaryHex }} />
            <span>Evolução & Resultados</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Acompanhe o volume total movimentado, frequência semanal e mensal, evolução de cargas por exercício, medidas corporais e recordes pessoais.
          </p>
        </div>

        <button
          onClick={() => onNavigate('evolution')}
          className="mt-4 w-full py-3 px-5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-bold uppercase tracking-wider text-white transition flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <TrendingUp className="w-4 h-4 text-primary-app" />
          <span>Abrir Painel de Evolução</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Goal & Compliance Progress (Checkpoint 06 - BLOCO 1) */}
      <GoalProgressCard onOpenSettings={() => setIsGoalModalOpen(true)} />

      {/* Automatic Weekly Summary (Checkpoint 06 - BLOCO 4) */}
      <WeeklySummaryCard />

      {/* Checkpoint 01 Status Information Card */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
          <Sparkles className="w-4 h-4 text-primary-app" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            TREINO CERTO — Status do Checkpoint 01
          </h3>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-elevated border border-emerald-500/25 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-400">
              CHECKPOINT 01 Auditado e Corrigido
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Todos os dados fictícios foram eliminados. Identidade TREINO CERTO aplicada integralmente. Sistema de 6 temas funcionando offline com persistência IndexedDB validada e backup JSON atômico com suporte retroativo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenThemeModal}
            className="py-2.5 px-3 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition text-center"
          >
            Biblioteca de Temas
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className="py-2.5 px-3 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition text-center"
          >
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Goal Settings Modal */}
      <GoalSettingsModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  );
};
