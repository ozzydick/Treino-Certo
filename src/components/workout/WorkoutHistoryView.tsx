/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  History,
  Trash2,
  Download,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Weight,
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutSessionItem } from '../../types';
import { SvgLineChart } from '../evolution/SvgLineChart';
import { buildExerciseProgress, buildPersonalRecords } from '../../utils/workoutProgress';
import { buildWorkoutHistoryCsv } from '../../utils/workoutHistoryExport';
import { filterWorkoutHistory } from '../../utils/workoutHistoryFilters';
import { buildWorkoutPerformanceInsights } from '../../utils/workoutPerformanceInsights';

interface WorkoutHistoryViewProps {
  onBack: () => void;
}

export function WorkoutHistoryView({ onBack }: WorkoutHistoryViewProps) {
  const { sessionsHistory, deleteSessionHistory } = useWorkout();
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState<'all' | '7' | '30' | '90'>('all');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest' | 'volume' | 'duration'>('newest');
  const personalRecords = buildPersonalRecords(sessionsHistory);
  const exerciseProgress = buildExerciseProgress(sessionsHistory);
  const [selectedProgressExerciseId, setSelectedProgressExerciseId] = useState<string>('');
  const selectedExerciseId = selectedProgressExerciseId && exerciseProgress.has(selectedProgressExerciseId)
    ? selectedProgressExerciseId : (personalRecords[0]?.exerciseId || '');
  const selectedProgress = selectedExerciseId ? (exerciseProgress.get(selectedExerciseId) || []) : [];
  const selectedRecord = personalRecords.find(record => record.exerciseId === selectedExerciseId);
  const performanceInsights = useMemo(() => buildWorkoutPerformanceInsights(sessionsHistory), [sessionsHistory]);


  const toggleExpand = (id: string) => {
    setExpandedSessionId((prev) => (prev === id ? null : id));
  };

  const totalAccumulatedVolume = sessionsHistory.reduce(
    (acc, s) => acc + (s.totalVolumeKg || 0),
    0
  );

  const totalTimeSeconds = sessionsHistory.reduce(
    (acc, s) => acc + (s.durationSeconds || 0),
    0
  );
  const totalHours = Math.floor(totalTimeSeconds / 3600);
  const totalMinutes = Math.floor((totalTimeSeconds % 3600) / 60);

  const filteredSessions = useMemo(() => filterWorkoutHistory(sessionsHistory, { search: historySearch, period: historyPeriod, sort: historySort }), [sessionsHistory, historySearch, historyPeriod, historySort]);

  const filteredVolume = filteredSessions.reduce((total, session) => total + (session.totalVolumeKg || 0), 0);
  const exportFilteredHistory = () => {
    if (!filteredSessions.length) return;
    const csv = buildWorkoutHistoryCsv(filteredSessions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `treino-certo-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await deleteSessionHistory(id);
    setSessionToDelete(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Minha Ficha
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Histórico de Treinos</h1>
            <p className="text-xs text-slate-400">
              Registro real de cada sessão executada, volume total levantado e evolução
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Treinos Concluídos
            </span>
            <span className="text-xl font-bold text-white">{sessionsHistory.length}</span>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Volume Total Acumulado
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {totalAccumulatedVolume.toLocaleString('pt-BR')} kg
            </span>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">
              Tempo em Musculação
            </span>
            <span className="text-xl font-bold text-white">
              {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes} min`}
            </span>
          </div>
        </div>
      </div>

      {/* CP09.5 — Evolução e desempenho nas últimas oito semanas */}
      <section className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-black text-white">Evolução e desempenho</h2>
            <p className="text-xs text-slate-400 mt-1">Frequência, séries concluídas e volume das últimas oito semanas.</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">CP09.5</span>
        </div>
        {performanceInsights.completedSessions === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-900 rounded-xl p-4">Conclua uma sessão de musculação para começar a visualizar sua evolução semanal.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              <div className="bg-slate-900 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block">Semanas com treino</span>
                <strong className="text-xl text-white">{performanceInsights.activeWeeks}<span className="text-xs text-slate-500 font-medium">/8</span></strong>
                <span className="text-[10px] text-emerald-400">{performanceInsights.consistencyPercent}% de consistência</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block">Média por semana ativa</span>
                <strong className="text-xl text-white">{performanceInsights.averageSessionsPerActiveWeek}</strong>
                <span className="text-[10px] text-slate-500">sessões concluídas</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block">Séries concluídas</span>
                <strong className="text-xl text-white">{performanceInsights.completedSets.toLocaleString('pt-BR')}</strong>
                <span className="text-[10px] text-slate-500">nas oito semanas</span>
              </div>
              <div className="bg-slate-900 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 block">Volume registrado</span>
                <strong className="text-xl text-orange-400">{performanceInsights.totalVolumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</strong>
                <span className="text-[10px] text-slate-500">nas oito semanas</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-bold text-white">Volume semanal</h3>
                  <span className="text-[10px] text-slate-500">kg</span>
                </div>
                <SvgLineChart data={performanceInsights.weeks.map(week => ({ label: week.label, value: Number(week.volumeKg.toFixed(1)), secondaryLabel: `${week.sessions} treino(s) · ${week.completedSets} série(s)` }))} unit="kg" height={170} emptyMessage="Sem volume registrado neste período." />
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-3">
                <h3 className="text-xs font-bold text-white">Comparativo de volume</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[10px] text-slate-500 block">Quatro semanas anteriores</span><strong className="text-sm text-white">{performanceInsights.previousFourWeekVolumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</strong></div>
                  <div><span className="text-[10px] text-slate-500 block">Quatro semanas recentes</span><strong className="text-sm text-white">{performanceInsights.recentFourWeekVolumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</strong></div>
                </div>
                <div className="rounded-xl bg-slate-800/70 p-3">
                  <span className="text-[10px] text-slate-400 block">Variação entre os períodos</span>
                  {performanceInsights.volumeChangePercent === null ? (
                    <strong className="text-sm text-slate-300">Histórico anterior insuficiente para comparação</strong>
                  ) : (
                    <strong className={`text-lg ${performanceInsights.volumeChangePercent > 0 ? 'text-emerald-400' : performanceInsights.volumeChangePercent < 0 ? 'text-amber-400' : 'text-white'}`}>
                      {performanceInsights.volumeChangePercent > 0 ? '+' : ''}{performanceInsights.volumeChangePercent.toLocaleString('pt-BR')}%
                    </strong>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">Comparação do volume total registrado; a semana atual pode estar incompleta e o indicador não representa isoladamente ganho ou perda de desempenho.</p>
                </div>
                {performanceInsights.bestWeek && <div className="text-[11px] text-slate-400">Melhor semana do período: <strong className="text-white">{performanceInsights.bestWeek.label}</strong> · {performanceInsights.bestWeek.volumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</div>}
              </div>
            </div>
          </>
        )}
      </section>

      {/* CP08.2 — Recordes pessoais e progressão */}
      <section className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-sm font-black text-white">Recordes pessoais e progressão</h2>
            <p className="text-xs text-slate-400 mt-1">Evolução calculada a partir das séries concluídas.</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-400">CP08.2</span>
        </div>
        {personalRecords.length === 0 ? (
          <p className="text-xs text-slate-500 bg-slate-900 rounded-xl p-4">Ainda não há séries concluídas com carga suficiente para calcular recordes. Os dados aparecerão após os próximos treinos.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-slate-900 rounded-xl p-3"><span className="text-[10px] text-slate-500 block">Exercícios com histórico</span><strong className="text-xl text-white">{personalRecords.length}</strong></div>
              <div className="bg-slate-900 rounded-xl p-3"><span className="text-[10px] text-slate-500 block">Maior carga registrada</span><strong className="text-xl text-orange-400">{Math.max(...personalRecords.map(r => r.maxWeightKg)).toLocaleString('pt-BR')} kg</strong></div>
              <div className="bg-slate-900 rounded-xl p-3"><span className="text-[10px] text-slate-500 block">Maior 1RM estimado</span><strong className="text-xl text-emerald-400">{Math.max(...personalRecords.map(r => r.estimatedOneRepMaxKg)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</strong></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold">Exercício</label>
                <select value={selectedExerciseId} onChange={event => setSelectedProgressExerciseId(event.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white">
                  {personalRecords.map(record => <option key={record.exerciseId} value={record.exerciseId}>{record.exerciseName}</option>)}
                </select>
                {selectedRecord && <div className="bg-slate-900 rounded-xl p-3 space-y-2">
                  <div><span className="text-[10px] text-slate-500 block">Recorde de carga</span><strong className="text-lg text-white">{selectedRecord.maxWeightKg.toLocaleString('pt-BR')} kg</strong></div>
                  <div><span className="text-[10px] text-slate-500 block">1RM estimado (Epley)</span><strong className="text-lg text-emerald-400">{selectedRecord.estimatedOneRepMaxKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</strong></div>
                  <div><span className="text-[10px] text-slate-500 block">Melhor volume em uma série</span><strong className="text-sm text-orange-400">{selectedRecord.bestSetVolumeKg.toLocaleString('pt-BR')} kg·reps</strong></div>
                </div>}
              </div>
              <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2"><h3 className="text-xs font-bold text-white">Evolução do 1RM estimado</h3><span className="text-[10px] text-slate-500">kg</span></div>
                <SvgLineChart data={selectedProgress.filter(point => point.estimatedOneRepMaxKg > 0).map(point => ({ label: point.label, value: Number(point.estimatedOneRepMaxKg.toFixed(1)), secondaryLabel: `${point.maxWeightKg} kg × ${point.reps}` }))} unit="kg" height={160} emptyMessage="São necessárias séries de 1 a 12 repetições com carga para estimar o 1RM." />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] text-slate-400 uppercase font-bold">Recordes por exercício</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {personalRecords.slice(0, 8).map(record => <button type="button" key={record.exerciseId} onClick={() => setSelectedProgressExerciseId(record.exerciseId)} className={`text-left rounded-xl border p-3 ${selectedExerciseId === record.exerciseId ? 'border-orange-500/50 bg-orange-500/5' : 'border-slate-800 bg-slate-900'}`}><span className="block text-xs font-semibold text-white">{record.exerciseName}</span><span className="text-[10px] text-slate-400">{record.maxWeightKg.toLocaleString('pt-BR')} kg · 1RM {record.estimatedOneRepMaxKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg</span></button>)}
              </div>
            </div>
          </>
        )}
      </section>

      {/* CP09.4 — Busca, filtros, ordenação e exportação do histórico */}
      <section className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-white">Explorar histórico</h2>
          </div>
          <button type="button" onClick={exportFilteredHistory} disabled={!filteredSessions.length} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-500/20 transition-colors" aria-label="Exportar histórico filtrado em CSV">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={historySearch} onChange={event => setHistorySearch(event.target.value)} placeholder="Buscar ficha, divisão ou exercício..." aria-label="Buscar no histórico de treinos" className="w-full min-h-11 pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60" />
          </label>
          <select value={historyPeriod} onChange={event => setHistoryPeriod(event.target.value as typeof historyPeriod)} aria-label="Filtrar período do histórico" className="min-h-11 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white">
            <option value="all">Todo o período</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option>
          </select>
          <select value={historySort} onChange={event => setHistorySort(event.target.value as typeof historySort)} aria-label="Ordenar histórico" className="min-h-11 px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white">
            <option value="newest">Mais recentes</option><option value="oldest">Mais antigos</option><option value="volume">Maior volume</option><option value="duration">Maior duração</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
          <span>{filteredSessions.length} de {sessionsHistory.length} treinos · {filteredVolume.toLocaleString('pt-BR')} kg no filtro</span>
          {(historySearch || historyPeriod !== 'all' || historySort !== 'newest') && <button type="button" onClick={() => { setHistorySearch(''); setHistoryPeriod('all'); setHistorySort('newest'); }} className="text-orange-300 hover:text-orange-200 font-semibold">Limpar filtros</button>}
        </div>
      </section>

      {/* History List */}
      <div className="space-y-3">
        {sessionsHistory.length === 0 ? (
          <div className="bg-slate-850 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Dumbbell className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-sm font-semibold text-white">Nenhum treino registrado ainda</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Quando você iniciar e concluir uma sessão de musculação através da sua ficha, ela aparecerá aqui com todos os detalhes de séries, repetições e cargas.
            </p>
          </div>
        ) : (
          filteredSessions.length === 0 ? (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
              <Search className="w-7 h-7 mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-white">Nenhum treino encontrado</h3>
              <p className="text-xs text-slate-400">Ajuste a busca ou o período para visualizar outros registros.</p>
              <button type="button" onClick={() => { setHistorySearch(''); setHistoryPeriod('all'); }} className="text-xs font-bold text-orange-300">Limpar busca e período</button>
            </div>
          ) : filteredSessions.map((session: WorkoutSessionItem) => {
            const isExpanded = expandedSessionId === session.id;
            const startDate = new Date(session.startTime);
            const formattedDate = startDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const formattedTime = startDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const durationMin = Math.round((session.durationSeconds || 0) / 60);

            return (
              <div
                key={session.id}
                className="bg-slate-850 border border-slate-800 rounded-2xl overflow-hidden transition-all hover:border-slate-700"
              >
                {/* Header card */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white">{session.divisionName}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                          {session.planName || 'Ficha'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" /> {formattedDate} às{' '}
                          {formattedTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" /> {durationMin} min
                        </span>
                        <span className="flex items-center gap-1 text-orange-400 font-semibold">
                          <Weight className="w-3.5 h-3.5" />{' '}
                          {(session.totalVolumeKg || 0).toLocaleString('pt-BR')} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Excluir este registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 space-y-4">
                    {session.notes && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                        <strong className="text-orange-400 block mb-0.5">
                          Observações da Sessão:
                        </strong>
                        {session.notes}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Detalhamento dos Exercícios e Séries
                      </h4>

                      {session.exerciseLogs && session.exerciseLogs.length > 0 ? (
                        session.exerciseLogs.map((exLog, exIdx) => {
                          const completedSets = exLog.sets.filter((s) => s.completed);

                          return (
                            <div
                              key={exLog.exerciseId || exIdx}
                              className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-white">
                                  #{exIdx + 1} {exLog.exerciseName}
                                </span>
                                {exLog.skipped ? (
                                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                    Pulado
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                                    {completedSets.length} / {exLog.sets.length} séries
                                  </span>
                                )}
                              </div>

                              {/* Sets list */}
                              {!exLog.skipped && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                                  {exLog.sets.map((setLog) => (
                                    <div
                                      key={setLog.setNumber}
                                      className={`p-2 rounded-lg border text-center ${
                                        setLog.completed
                                          ? 'bg-slate-900 border-slate-800 text-slate-200'
                                          : 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                                      }`}
                                    >
                                      <span className="text-[9px] text-slate-500 block uppercase">
                                        Série {setLog.setNumber}
                                      </span>
                                      <span className="font-bold text-white">
                                        {setLog.actualReps} reps × {setLog.actualWeightKg} kg
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500">
                          {session.exercisesCompleted} exercícios registrados.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Excluir Registro de Treino?</h3>
            <p className="text-xs text-slate-400">
              Esta ação removerá este treino do seu histórico e atualizará suas estatísticas. Deseja continuar?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sessionToDelete)}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
