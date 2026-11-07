/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Activity,
  Dumbbell,
  Trophy,
  Calendar,
  Plus,
  Scale,
  Flame,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileSpreadsheet,
  FileText,
  Edit2,
  CalendarDays,
  Target,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWorkout } from '../../context/WorkoutContext';
import { useEvolution } from '../../context/EvolutionContext';
import { BodyMeasurementItem, EvolutionTimeRange, NavigationTab } from '../../types';
import { SvgLineChart } from './SvgLineChart';
import { MeasurementModal } from './MeasurementModal';
import { ActivityCalendar } from './ActivityCalendar';
import {
  calculateExerciseEvolution,
  compareBodyAssessments,
} from '../../utils/evolutionCalculator';
import { DEFAULT_EXERCISES_CATALOG } from '../../constants/exercisesCatalog';

interface EvolutionViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenEquipments?: () => void;
}

export const EvolutionView: React.FC<EvolutionViewProps> = ({ onNavigate }) => {
  const { themeConfig } = useTheme();
  const { sessionsHistory } = useWorkout();
  const {
    measurements,
    selectedTimeRange,
    setSelectedTimeRange,
    saveMeasurement,
    deleteMeasurement,
    overallMetrics,
    personalRecords,
    exportJson,
    exportCsv,
  } = useEvolution();

  // Sub-tabs dentro de Evolução
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'body' | 'performance' | 'records' | 'reports'
  >('overview');

  // Modal de medidas corporais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<BodyMeasurementItem | null>(null);

  // Métrica selecionada para o gráfico de medidas
  const [selectedBodyMetric, setSelectedBodyMetric] = useState<keyof BodyMeasurementItem>('weightKg');

  // Seleção de duas avaliações para comparação
  const [compareIdA, setCompareIdA] = useState<string>('');
  const [compareIdB, setCompareIdB] = useState<string>('');

  // Exercício selecionado para evolução de desempenho
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  // Exercícios distintos presentes nas sessões concluídas
  const exercisesWithHistory = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sessionsHistory) {
      if (!s.isCompleted || !s.exerciseLogs) continue;
      for (const ex of s.exerciseLogs) {
        if (!ex.skipped && ex.exerciseId) {
          map.set(ex.exerciseId, ex.exerciseName || ex.exerciseId);
        }
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessionsHistory]);

  // Define exercício inicial selecionado
  const activeExerciseId =
    selectedExerciseId ||
    (exercisesWithHistory.length > 0 ? exercisesWithHistory[0].id : DEFAULT_EXERCISES_CATALOG[0].id);

  const exerciseEvolution = useMemo(() => {
    return calculateExerciseEvolution(activeExerciseId, sessionsHistory);
  }, [activeExerciseId, sessionsHistory]);

  // Formatação de duração acumulada
  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  // Formatação de volume total
  const formatVolume = (kg: number) => {
    if (kg >= 10000) {
      return `${(kg / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`;
    }
    return `${kg.toLocaleString('pt-BR')} kg`;
  };

  // Download de relatórios
  const handleDownloadJson = () => {
    const content = exportJson();
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treino-certo-relatorio-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const content = exportCsv();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `treino-certo-relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Configuração dos filtros de período
  const timeRangeOptions: { id: EvolutionTimeRange; label: string }[] = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' },
    { id: '6m', label: '6 meses' },
    { id: '12m', label: '12 meses' },
    { id: 'all', label: 'Todos' },
  ];

  // Dados para o gráfico de evolução de volume
  const volumeChartData = useMemo(() => {
    return overallMetrics.volumeOverTime.map((p) => ({
      label: p.displayDate,
      value: p.volumeKg,
      secondaryLabel: p.divisionNames.join(', '),
    }));
  }, [overallMetrics]);

  // Dados para o gráfico da medida corporal selecionada
  const bodyMetricChartData = useMemo(() => {
    const sorted = [...measurements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const points: Array<{ label: string; value: number }> = [];
    for (const m of sorted) {
      const val = m[selectedBodyMetric];
      if (typeof val === 'number' && !isNaN(val)) {
        const parts = m.date.split('-');
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : m.date;
        points.push({ label, value: val });
      }
    }
    return points;
  }, [measurements, selectedBodyMetric]);

  // Dados para o gráfico de evolução de carga do exercício selecionado
  const exerciseLoadChartData = useMemo(() => {
    return exerciseEvolution.history.map((h) => ({
      label: h.displayDate,
      value: h.maxWeightKg,
      secondaryLabel: `${h.divisionName} (${h.completedSetsCount} séries)`,
    }));
  }, [exerciseEvolution]);

  // Avaliações para comparação
  const assessmentA = measurements.find((m) => m.id === compareIdA) || measurements[0] || null;
  const assessmentB =
    measurements.find((m) => m.id === compareIdB) || (measurements.length > 1 ? measurements[1] : null);

  const comparisonMetrics = useMemo(() => {
    if (!assessmentA || !assessmentB) return [];
    // Compara A (mais recente) com B (anterior)
    const isANewer = new Date(assessmentA.date).getTime() >= new Date(assessmentB.date).getTime();
    return compareBodyAssessments(
      isANewer ? assessmentA : assessmentB,
      isANewer ? assessmentB : assessmentA
    );
  }, [assessmentA, assessmentB]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
            CHECKPOINT 05 · ACOMPANHAMENTO REAL
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
            <TrendingUp className="w-6 h-6" style={{ color: themeConfig.primaryHex }} />
            <span>Evolução & Resultados</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Métricas fidedignas de volume, frequência, progressão de cargas e medidas corporais.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingMeasurement(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-black font-bold text-xs uppercase tracking-wider transition shadow-sm"
            style={{
              backgroundColor: themeConfig.primaryHex,
              boxShadow: `0 2px 10px rgba(${themeConfig.rgb}, 0.3)`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-white/5">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Activity },
          { id: 'body', label: 'Medidas Corporais', icon: Scale },
          { id: 'performance', label: 'Desempenho por Exercício', icon: Dumbbell },
          { id: 'records', label: 'Recordes Pessoais', icon: Trophy },
          { id: 'reports', label: 'Calendário & Relatórios', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-surface-elevated text-white border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={isActive ? { borderColor: themeConfig.primaryHex } : undefined}
            >
              <Icon
                className="w-4 h-4"
                style={isActive ? { color: themeConfig.primaryHex } : undefined}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================
          SUB-TAB 1: VISÃO GERAL (PAINEL DE EVOLUÇÃO)
          ======================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Time range selector pills */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-400">Filtrar por período:</span>
            <div className="flex items-center gap-1 bg-[#0A0E13] p-1 rounded-xl border border-white/5">
              {timeRangeOptions.map((opt) => {
                const isSelected = selectedTimeRange === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedTimeRange(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isSelected
                        ? 'bg-surface-elevated text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={
                      isSelected
                        ? {
                            color: themeConfig.primaryHex,
                            borderColor: themeConfig.primaryHex,
                          }
                        : undefined
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Workouts */}
            <div className="p-4 rounded-2xl bg-surface-card border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Treinos Concluídos
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white">
                  {overallMetrics.totalWorkouts}
                </span>
                {overallMetrics.comparison.workoutsDelta !== 0 && (
                  <span
                    className={`text-[11px] font-bold flex items-center ${
                      overallMetrics.comparison.workoutsDelta > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {overallMetrics.comparison.workoutsDelta > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {overallMetrics.comparison.workoutsDelta > 0 ? '+' : ''}
                      {overallMetrics.comparison.workoutsDelta}
                    </span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block">
                vs período anterior ({overallMetrics.comparison.previousWorkouts})
              </span>
            </div>

            {/* Total Volume */}
            <div className="p-4 rounded-2xl bg-surface-card border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Volume Total
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {formatVolume(overallMetrics.totalVolumeKg)}
                </span>
                {overallMetrics.comparison.volumeDeltaPercent !== 0 && (
                  <span
                    className={`text-[11px] font-bold flex items-center ${
                      overallMetrics.comparison.volumeDeltaKg > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {overallMetrics.comparison.volumeDeltaKg > 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {overallMetrics.comparison.volumeDeltaPercent > 0 ? '+' : ''}
                      {overallMetrics.comparison.volumeDeltaPercent}%
                    </span>
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block">Carga real movimentada</span>
            </div>

            {/* Total Time */}
            <div className="p-4 rounded-2xl bg-surface-card border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Tempo Acumulado
              </span>
              <span className="text-xl sm:text-2xl font-black text-white block">
                {formatDuration(overallMetrics.totalTrainingTimeSeconds)}
              </span>
              <span className="text-[10px] text-slate-500 block">Duração ativa em treino</span>
            </div>

            {/* Active Weeks Streak */}
            <div className="p-4 rounded-2xl bg-surface-card border border-white/10 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Sequência de Semanas
              </span>
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-primary-app animate-pulse" />
                <span className="text-2xl font-black text-white">
                  {overallMetrics.activeWeeksStreak}
                </span>
                <span className="text-xs text-slate-400">
                  {overallMetrics.activeWeeksStreak === 1 ? 'semana' : 'semanas'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">Consistência ininterrupta</span>
            </div>
          </div>

          {/* Frequency Details Card */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-app" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Frequência Semanal e Mensal
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-300">
                Semana atual: <strong className="text-white">{overallMetrics.currentWeekWorkouts} treinos</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Média Semanal no Período</span>
                  <span className="text-lg font-black text-white">
                    {overallMetrics.weeklyFrequency} treinos / semana
                  </span>
                </div>
                <span className="text-xs text-slate-500">7 dias</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Média Mensal no Período</span>
                  <span className="text-lg font-black text-white">
                    {overallMetrics.monthlyFrequency} treinos / mês
                  </span>
                </div>
                <span className="text-xs text-slate-500">30 dias</span>
              </div>
            </div>
          </div>

          {/* Volume Evolution Chart */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary-app" />
                  <span>Evolução do Volume ao Longo do Tempo</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Somatório da carga efetivamente executada em cada sessão de treino (kg)
                </p>
              </div>
            </div>

            <div className="pt-2">
              <SvgLineChart
                data={volumeChartData}
                unit="kg"
                height={200}
                emptyMessage="Nenhuma sessão de treino concluída no período selecionado."
              />
            </div>
          </div>

          {/* Comparison Between Periods Card */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Sparkles className="w-4 h-4 text-primary-app" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Comparação com Período Anterior
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block">Diferença de Treinos</span>
                <span
                  className={`text-base font-bold ${
                    overallMetrics.comparison.workoutsDelta >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {overallMetrics.comparison.workoutsDelta >= 0 ? '+' : ''}
                  {overallMetrics.comparison.workoutsDelta} sessões
                </span>
                <p className="text-[10px] text-slate-500">
                  {overallMetrics.comparison.currentWorkouts} atual vs {overallMetrics.comparison.previousWorkouts} anterior
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block">Diferença de Volume</span>
                <span
                  className={`text-base font-bold ${
                    overallMetrics.comparison.volumeDeltaKg >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {overallMetrics.comparison.volumeDeltaKg >= 0 ? '+' : ''}
                  {overallMetrics.comparison.volumeDeltaKg.toLocaleString('pt-BR')} kg
                </span>
                <p className="text-[10px] text-slate-500">
                  Variação percentual: {overallMetrics.comparison.volumeDeltaPercent}%
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400 block">Diferença de Duração</span>
                <span
                  className={`text-base font-bold ${
                    overallMetrics.comparison.durationDeltaSeconds >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {overallMetrics.comparison.durationDeltaSeconds >= 0 ? '+' : ''}
                  {Math.round(overallMetrics.comparison.durationDeltaSeconds / 60)} min
                </span>
                <p className="text-[10px] text-slate-500">Tempo ativo total de musculação</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: MEDIDAS CORPORAIS
          ======================================================== */}
      {activeSubTab === 'body' && (
        <div className="space-y-6">
          {/* Header Action & Metrics Selector */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary-app" />
                  <span>Gráfico Individual de Medida</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Acompanhe a curva de evolução ao longo das avaliações cadastradas.
                </p>
              </div>

              {/* Selector */}
              <select
                value={selectedBodyMetric}
                onChange={(e) => setSelectedBodyMetric(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-primary-app"
              >
                <option value="weightKg">Peso Corporal (kg)</option>
                <option value="waistCm">Cintura (cm)</option>
                <option value="abdomenCm">Abdômen (cm)</option>
                <option value="chestCm">Peito / Tórax (cm)</option>
                <option value="armRightCm">Braço Direito (cm)</option>
                <option value="armLeftCm">Braço Esquerdo (cm)</option>
                <option value="thighRightCm">Coxa Direita (cm)</option>
                <option value="thighLeftCm">Coxa Esquerda (cm)</option>
                <option value="calfRightCm">Panturrilha Direita (cm)</option>
                <option value="calfLeftCm">Panturrilha Esquerda (cm)</option>
              </select>
            </div>

            <div className="pt-2">
              <SvgLineChart
                data={bodyMetricChartData}
                unit={selectedBodyMetric === 'weightKg' ? 'kg' : 'cm'}
                height={180}
                emptyMessage="Nenhuma avaliação física com esta medida cadastrada ainda."
              />
            </div>
          </div>

          {/* Comparison Between Two Assessments */}
          {measurements.length >= 2 && (
            <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-app" />
                    <span>Comparativo Entre Duas Avaliações</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione duas datas para comparar a variação das circunferências e peso.
                  </p>
                </div>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Avaliação Mais Recente (A):</label>
                  <select
                    value={compareIdA || (assessmentA ? assessmentA.id : '')}
                    onChange={(e) => setCompareIdA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-white"
                  >
                    {measurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.date.split('-').reverse().join('/')} {m.weightKg ? `(${m.weightKg} kg)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Avaliação Anterior (B):</label>
                  <select
                    value={compareIdB || (assessmentB ? assessmentB.id : '')}
                    onChange={(e) => setCompareIdB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs text-white"
                  >
                    {measurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.date.split('-').reverse().join('/')} {m.weightKg ? `(${m.weightKg} kg)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 text-[10px] uppercase font-bold">
                      <th className="py-2">Medida</th>
                      <th className="py-2 text-center">Mais Recente</th>
                      <th className="py-2 text-center">Anterior</th>
                      <th className="py-2 text-right">Variação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comparisonMetrics.map((cm) => (
                      <tr key={cm.key} className="hover:bg-white/5 transition">
                        <td className="py-2.5 font-semibold text-white">{cm.label}</td>
                        <td className="py-2.5 text-center text-slate-300">
                          {cm.currentVal !== undefined ? `${cm.currentVal} ${cm.unit}` : '—'}
                        </td>
                        <td className="py-2.5 text-center text-slate-400">
                          {cm.prevVal !== undefined ? `${cm.prevVal} ${cm.unit}` : '—'}
                        </td>
                        <td className="py-2.5 text-right font-bold">
                          {cm.delta !== undefined ? (
                            <span
                              className={
                                cm.delta > 0
                                  ? 'text-emerald-400'
                                  : cm.delta < 0
                                  ? 'text-sky-400'
                                  : 'text-slate-400'
                              }
                            >
                              {cm.delta > 0 ? '+' : ''}
                              {cm.delta} {cm.unit} ({cm.deltaPercent}%)
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* History of Assessments */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary-app" />
                <span>Histórico de Avaliações Registradas</span>
              </h3>
              <span className="text-xs text-slate-400">
                {measurements.length === 1
                  ? '1 avaliação'
                  : `${measurements.length} avaliações`}
              </span>
            </div>

            {measurements.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Scale className="w-10 h-10 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Nenhuma avaliação corporal cadastrada ainda. Clique no botão acima para registrar suas primeiras medidas.
                </p>
                <button
                  onClick={() => {
                    setEditingMeasurement(null);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-black font-bold text-xs uppercase tracking-wider"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  Cadastrar Avaliação Inicial
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {measurements.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {m.date.split('-').reverse().join('/')}
                        </span>
                        {m.weightKg && (
                          <span className="px-2 py-0.5 rounded-md bg-[#121820] text-primary-app text-xs font-bold border border-white/5">
                            {m.weightKg} kg
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setEditingMeasurement(m);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    </div>

                    {/* Circumferences list */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {m.waistCm && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Cintura</span>
                          <span className="font-bold text-white">{m.waistCm} cm</span>
                        </div>
                      )}
                      {m.abdomenCm && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Abdômen</span>
                          <span className="font-bold text-white">{m.abdomenCm} cm</span>
                        </div>
                      )}
                      {m.chestCm && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Peito</span>
                          <span className="font-bold text-white">{m.chestCm} cm</span>
                        </div>
                      )}
                      {(m.armRightCm || m.armLeftCm) && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Braços (D / E)</span>
                          <span className="font-bold text-white">
                            {m.armRightCm ?? '—'} / {m.armLeftCm ?? '—'} cm
                          </span>
                        </div>
                      )}
                      {(m.thighRightCm || m.thighLeftCm) && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Coxas (D / E)</span>
                          <span className="font-bold text-white">
                            {m.thighRightCm ?? '—'} / {m.thighLeftCm ?? '—'} cm
                          </span>
                        </div>
                      )}
                      {(m.calfRightCm || m.calfLeftCm) && (
                        <div className="p-2 rounded-xl bg-[#0A0E13] border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Panturrilhas (D / E)</span>
                          <span className="font-bold text-white">
                            {m.calfRightCm ?? '—'} / {m.calfLeftCm ?? '—'} cm
                          </span>
                        </div>
                      )}
                    </div>

                    {m.notes && (
                      <p className="text-xs text-slate-400 italic bg-[#0B0F14] p-2 rounded-xl border border-white/5">
                        "{m.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: DESEMPENHO POR EXERCÍCIO
          ======================================================== */}
      {activeSubTab === 'performance' && (
        <div className="space-y-6">
          {/* Exercise Selector */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-primary-app" />
                <span>Selecionar Exercício do Histórico:</span>
              </label>

              <select
                value={activeExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-primary-app"
              >
                {exercisesWithHistory.length > 0 ? (
                  exercisesWithHistory.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
                ) : (
                  DEFAULT_EXERCISES_CATALOG.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Exercise Performance Summary Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-surface-card border border-white/10 space-y-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary-app block">
                Histórico & Sobrecarga Progressiva
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">
                {exerciseEvolution.exerciseName}
              </h2>
            </div>

            {/* KPI mini cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Maior Carga (PR)
                </span>
                <span className="text-xl font-black text-white block">
                  {exerciseEvolution.allTimeMaxWeightKg > 0
                    ? `${exerciseEvolution.allTimeMaxWeightKg} kg`
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-500">Carga máxima realizada</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Maior Volume
                </span>
                <span className="text-xl font-black text-white block">
                  {exerciseEvolution.allTimeMaxVolumeSessionKg > 0
                    ? `${exerciseEvolution.allTimeMaxVolumeSessionKg.toLocaleString('pt-BR')} kg`
                    : '—'}
                </span>
                <span className="text-[10px] text-slate-500">Volume em uma sessão</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Sessões Realizadas
                </span>
                <span className="text-xl font-black text-white block">
                  {exerciseEvolution.sessionsCount}
                </span>
                <span className="text-[10px] text-slate-500">Frequência deste exercício</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Última Progressão
                </span>
                <div className="flex items-center gap-1">
                  {exerciseEvolution.loadProgressionKg !== 0 ? (
                    <span
                      className={`text-base font-bold flex items-center ${
                        exerciseEvolution.loadProgressionKg > 0
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {exerciseEvolution.loadProgressionKg > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {exerciseEvolution.loadProgressionKg > 0 ? '+' : ''}
                        {exerciseEvolution.loadProgressionKg} kg
                      </span>
                    </span>
                  ) : (
                    <span className="text-base font-bold text-slate-400">Estável</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">vs sessão anterior</span>
              </div>
            </div>

            {/* Load Evolution Chart */}
            <div className="pt-2">
              <span className="text-xs font-bold text-white block mb-2">
                Progressão de Carga ao Longo das Sessões (kg):
              </span>
              <SvgLineChart
                data={exerciseLoadChartData}
                unit="kg"
                height={180}
                emptyMessage="Nenhuma sessão concluída registrada para este exercício ainda."
              />
            </div>
          </div>

          {/* Session by session history log */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Histórico Detalhado por Sessão
            </h3>

            {exerciseEvolution.history.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Execute treinos contendo este exercício para visualizar seu histórico de séries e repetições.
              </div>
            ) : (
              <div className="space-y-2.5">
                {exerciseEvolution.history
                  .slice()
                  .reverse()
                  .map((log) => (
                    <div
                      key={log.sessionId}
                      className="p-3.5 rounded-2xl bg-surface-elevated border border-white/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{log.displayDate}</span>
                          <span className="px-2 py-0.5 rounded bg-[#121820] text-primary-app text-[11px] font-semibold border border-white/5">
                            {log.divisionName}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                          <span>Carga máxima: <strong className="text-white">{log.maxWeightKg} kg</strong></span>
                          <span>Volume: <strong className="text-white">{log.totalVolumeKg.toLocaleString('pt-BR')} kg</strong></span>
                        </div>
                      </div>

                      {/* Sets list */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                        {log.sets.map((st) => (
                          <span
                            key={st.setNumber}
                            className="px-2 py-1 rounded-lg bg-[#0B0F14] border border-white/5 text-[11px] text-slate-300"
                          >
                            Série {st.setNumber}: <strong className="text-white">{st.actualWeightKg}kg</strong> × {st.actualReps} reps
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: RECORDES PESSOAIS (PRs)
          ======================================================== */}
      {activeSubTab === 'records' && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Quadro de Recordes Pessoais</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Marcas históricas verificadas e efetivamente executadas nos seus treinos.
                </p>
              </div>
            </div>

            {personalRecords.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhum recorde registrado ainda</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Os recordes pessoais são identificados automaticamente a partir das sessões de musculação concluídas com sucesso.
                </p>
                <button
                  onClick={() => onNavigate('plan')}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  Ir para Minha Ficha de Treino
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {personalRecords.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-4 rounded-2xl bg-surface-elevated border border-white/5 space-y-2 hover:border-white/10 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            {pr.title}
                          </span>
                          <h4 className="text-sm font-bold text-white mt-0.5">{pr.exerciseName}</h4>
                        </div>
                      </div>

                      <span
                        className="text-lg font-black tracking-tight"
                        style={{ color: themeConfig.primaryHex }}
                      >
                        {pr.valueDisplay}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                      <span>{pr.subtitle}</span>
                      <span>{pr.displayDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: CALENDÁRIO & RELATÓRIOS
          ======================================================== */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {/* Export Options Banner */}
          <div className="p-5 rounded-3xl bg-surface-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary-app" />
                  <span>Exportação de Relatórios de Evolução</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exporte o histórico completo de treinos e avaliações físicas para análise offline ou planilhas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadJson}
                className="p-3.5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app transition flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-surface flex items-center justify-center shrink-0 border border-primary-app/30">
                  <FileText className="w-5 h-5 text-primary-app" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-primary-app transition">
                    Exportar Relatório JSON
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Arquivo estruturado com todas as métricas, sessões e medidas
                  </span>
                </div>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="p-3.5 rounded-2xl bg-surface-elevated border border-white/10 hover:border-primary-app transition flex items-center gap-3 text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block group-hover:text-emerald-400 transition">
                    Exportar Relatório CSV
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Planilha compatível com Excel, Google Planilhas e Numbers
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Monthly Activity Calendar */}
          <ActivityCalendar completedSessions={sessionsHistory} />
        </div>
      )}

      {/* Measurement Modal for Create/Edit */}
      <MeasurementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMeasurement(null);
        }}
        onSave={saveMeasurement}
        onDelete={deleteMeasurement}
        initialData={editingMeasurement}
      />
    </div>
  );
};
