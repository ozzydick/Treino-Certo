/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  User,
  Palette,
  Database,
  Download,
  Upload,
  CheckCircle2,
  Calendar,
  Ruler,
  Weight,
  Target,
  Building2,
  Flame,
  Save,
  AlertTriangle,
  X,
  FileCheck,
  ShieldCheck,
  Info,
  Dumbbell,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useEquipments } from '../../context/EquipmentsContext';
import { dbService, BackupValidationResult } from '../../services/db';
import { FitnessGoal, UserProfile } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { GoalSettingsModal } from '../goals/GoalSettingsModal';

interface Props {
  onOpenThemeModal: () => void;
  onOpenEquipments?: () => void;
}

export const ProfileView: React.FC<Props> = ({ onOpenThemeModal, onOpenEquipments }) => {
  const { themeConfig, reloadPreferences } = useTheme();
  const { profile, saveProfile, reloadProfile, isProfileConfigured } = useUser();
  const { totalSelectedCount, reloadEquipments } = useEquipments();

  const [formData, setFormData] = useState<UserProfile>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Backup and Restore State
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pendingBackupContent, setPendingBackupContent] = useState<string | null>(null);
  const [pendingValidation, setPendingValidation] = useState<BackupValidationResult | null>(null);
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleInputChange = (field: keyof UserProfile, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Confirmed persistence in IndexedDB
      await saveProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gravar no banco de dados local.';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Export JSON backup
  const handleExportBackup = async () => {
    try {
      const json = await dbService.exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `TREINO_CERTO_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMessage({
        type: 'success',
        text: 'Backup exportado com sucesso! Arquivo gerado localmente em formato JSON.',
      });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch {
      setBackupMessage({
        type: 'error',
        text: 'Erro ao gerar arquivo de exportação.',
      });
    }
  };

  // Trigger file selection for import
  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // Pre-validate before showing confirmation
      const validation = dbService.validateBackupString(content);
      if (!validation.isValid) {
        setBackupMessage({
          type: 'error',
          text: validation.error || 'Arquivo de backup inválido ou incompatível.',
        });
        setTimeout(() => setBackupMessage(null), 5000);
        return;
      }

      // Valid: open confirmation dialog
      setPendingBackupContent(content);
      setPendingValidation(validation);
      setShowConfirmRestoreModal(true);
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  // Confirmed Restore Action
  const executeRestore = async () => {
    if (!pendingBackupContent) return;

    setIsRestoring(true);
    try {
      const result = await dbService.importAllData(pendingBackupContent);
      if (result.success) {
        // Immediate synchronization of React contexts
        await reloadProfile();
        await reloadPreferences();
        await reloadEquipments();

        setBackupMessage({
          type: 'success',
          text: result.message,
        });
      } else {
        setBackupMessage({
          type: 'error',
          text: result.message,
        });
      }
    } catch (e: unknown) {
      setBackupMessage({
        type: 'error',
        text: `Falha na operação: ${(e as Error).message}`,
      });
    } finally {
      setIsRestoring(false);
      setShowConfirmRestoreModal(false);
      setPendingBackupContent(null);
      setPendingValidation(null);
      setTimeout(() => setBackupMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6 animate-in fade-in duration-200">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div
          className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: themeConfig.primaryHex }}
        />

        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/10 shrink-0 text-xl font-black text-black shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${themeConfig.complementaryHex}, ${themeConfig.primaryHex})`,
            }}
          >
            {formData.name && formData.name.trim().length > 0
              ? formData.name.trim().charAt(0).toUpperCase()
              : 'TC'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white">
                {formData.name && formData.name.trim().length > 0
                  ? formData.name
                  : 'Perfil do Atleta'}
              </h1>
              {isProfileConfigured && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-black uppercase"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  Ativo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{formData.gymName || 'Academia não informada'}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {formData.goal ? (
                <>
                  Meta: <strong className="text-slate-300 capitalize">{formData.goal}</strong>
                </>
              ) : (
                'Objetivo não selecionado'
              )}{' '}
              •{' '}
              {formData.weeklyFrequency && formData.weeklyFrequency > 0
                ? `${formData.weeklyFrequency}x por semana`
                : 'Frequência não definida'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenThemeModal}
          className="relative z-10 flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition active:scale-95"
        >
          <div
            className="w-3.5 h-3.5 rounded-full border border-white/20"
            style={{ backgroundColor: themeConfig.primaryHex }}
          />
          <span>Tema: {themeConfig.name}</span>
          <Palette className="w-3.5 h-3.5 text-primary-app ml-1" />
        </button>
      </div>

      {/* PWA Installation Card */}
      <PWAInstallButton variant="card" />

      {/* Minha Academia & Equipamentos Card (Checkpoint 02) */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${themeConfig.primaryHex}15`,
              borderColor: `${themeConfig.primaryHex}35`,
            }}
          >
            <Dumbbell className="w-5 h-5" style={{ color: themeConfig.primaryHex }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Equipamentos da Minha Academia</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {totalSelectedCount > 0
                ? `${totalSelectedCount} equipamentos selecionados no catálogo`
                : 'Nenhum equipamento selecionado ainda'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEquipments}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 shrink-0"
          style={{ backgroundColor: themeConfig.primaryHex }}
        >
          <span>Gerenciar Equipamentos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metas & Lembretes Locais Card (Checkpoint 06 - BLOCO 1 e BLOCO 2) */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `${themeConfig.primaryHex}15`,
              borderColor: `${themeConfig.primaryHex}35`,
            }}
          >
            <Target className="w-5 h-5" style={{ color: themeConfig.primaryHex }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Metas Pessoais & Lembretes Locais</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure frequência de treinos, dias preferidos e avisos internos do app
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGoalModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition active:scale-95 shrink-0 bg-surface-elevated border border-white/10 hover:border-primary-app"
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>Configurar Metas</span>
        </button>
      </div>

      {/* Goal Settings Modal */}
      <GoalSettingsModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />

      {/* Profile Form */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary-app" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Identificação & Dados Pessoais
            </h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Armazenado Localmente
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Digite seu nome (sem dados fictícios)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Academia Frequentada */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary-app" />
                Academia Frequentada
              </label>
              <input
                type="text"
                value={formData.gymName || ''}
                onChange={(e) => handleInputChange('gymName', e.target.value)}
                placeholder="Ex: Nome da sua academia..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition placeholder:text-slate-600"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary-app" />
                Data de Nascimento
              </label>
              <input
                type="date"
                value={formData.birthDate || ''}
                onChange={(e) => handleInputChange('birthDate', e.target.value || undefined)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Altura */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-primary-app" />
                Altura (cm)
              </label>
              <input
                type="number"
                min="100"
                max="250"
                value={formData.height ?? ''}
                onChange={(e) =>
                  handleInputChange(
                    'height',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Ex: 175"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition font-mono placeholder:text-slate-600"
              />
            </div>

            {/* Peso */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Weight className="w-3.5 h-3.5 text-primary-app" />
                Peso (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={formData.weight ?? ''}
                onChange={(e) =>
                  handleInputChange(
                    'weight',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Ex: 75.0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition font-mono placeholder:text-slate-600"
              />
            </div>

            {/* Frequência Semanal */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-primary-app" />
                Meta Semanal
              </label>
              <select
                value={formData.weeklyFrequency ?? ''}
                onChange={(e) =>
                  handleInputChange(
                    'weeklyFrequency',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-input border border-white/10 text-white text-sm focus:outline-hidden focus:border-primary-app transition"
              >
                <option value="">Não definida</option>
                <option value="1">1 dia / semana</option>
                <option value="2">2 dias / semana</option>
                <option value="3">3 dias / semana</option>
                <option value="4">4 dias / semana</option>
                <option value="5">5 dias / semana</option>
                <option value="6">6 dias / semana</option>
                <option value="7">7 dias / semana</option>
              </select>
            </div>
          </div>

          {/* Objetivo Principal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary-app" />
              Objetivo Principal
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'hipertrofia', label: 'Hipertrofia' },
                { id: 'emagrecimento', label: 'Emagrecimento' },
                { id: 'condicionamento', label: 'Condicionamento' },
                { id: 'forca', label: 'Ganho de Força' },
                { id: 'saude', label: 'Saúde & Longevidade' },
              ].map((goalOption) => {
                const isSelected = formData.goal === goalOption.id;
                return (
                  <button
                    key={goalOption.id}
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'goal',
                        isSelected ? undefined : (goalOption.id as FitnessGoal)
                      )
                    }
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                      isSelected
                        ? 'border-white/40 bg-surface-elevated text-white'
                        : 'border-white/5 bg-surface-input text-slate-400 hover:text-slate-200'
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: themeConfig.primaryHex,
                            color: themeConfig.complementaryHex,
                          }
                        : undefined
                    }
                  >
                    <span>{goalOption.label}</span>
                    {isSelected && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeConfig.primaryHex }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-black font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                backgroundColor: themeConfig.primaryHex,
                boxShadow: `0 3px 15px rgba(${themeConfig.rgb}, 0.35)`,
              }}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Gravando no banco local...' : 'Salvar Perfil'}</span>
            </button>

            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Perfil persistido com sucesso no IndexedDB!
              </span>
            )}

            {saveError && (
              <span className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4" /> {saveError}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Appearance & Themes Shortcut Card */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary-app" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Aparência & Identidade Visual
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Dark Premium</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-elevated border border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 shadow-inner flex shrink-0">
              <div
                className="w-1/2 h-full"
                style={{ backgroundColor: themeConfig.primaryHex }}
              />
              <div
                className="w-1/2 h-full"
                style={{ backgroundColor: themeConfig.complementaryHex }}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Tema: {themeConfig.name}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold text-black uppercase"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  {themeConfig.label}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{themeConfig.description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenThemeModal}
            className="px-4 py-2.5 rounded-xl text-black font-bold text-xs uppercase tracking-wider shrink-0 transition"
            style={{
              backgroundColor: themeConfig.primaryHex,
              boxShadow: `0 2px 10px rgba(${themeConfig.rgb}, 0.3)`,
            }}
          >
            Biblioteca de Temas
          </button>
        </div>
      </div>

      {/* Storage and Backup Section */}
      <div className="p-5 rounded-3xl bg-surface-card border border-white/10">
        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-app" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Armazenamento & Backup Atômico
            </h2>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> IndexedDB Ativo
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          O <strong>TREINO CERTO</strong> armazena seus dados no banco local do seu aparelho
          (banco <code>fit_app_db</code> preservado), funcionando 100% offline. Você pode exportar
          um backup completo em formato JSON ou restaurar backups anteriores com validação atômica
          e suporte retroativo.
        </p>

        {backupMessage && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
              backupMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : backupMessage.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-primary-surface border-primary-app/30 text-white'
            }`}
          >
            {backupMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <span>{backupMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="p-3.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4 text-primary-app" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-primary-app text-xs font-semibold text-white transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4 text-primary-app" />
            <span>Restaurar Backup (JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelected}
            className="hidden"
          />
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {showConfirmRestoreModal && pendingValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#121820] border border-white/15 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => {
                setShowConfirmRestoreModal(false);
                setPendingBackupContent(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Confirmar Restauração de Dados</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A restauração atômica irá substituir os dados atuais pelos dados do arquivo selecionado.
              </p>
            </div>

            {/* Backup Content Details */}
            <div className="p-3.5 rounded-2xl bg-surface-elevated border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Aplicativo de origem:</span>
                <span className="font-bold text-white">{pendingValidation.app}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Versão do backup:</span>
                <span className="font-mono text-slate-400">{pendingValidation.version}</span>
              </div>
              {pendingValidation.details?.userName && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Nome no backup:</span>
                  <span className="font-bold text-white">{pendingValidation.details.userName}</span>
                </div>
              )}
              {pendingValidation.details?.theme && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Tema salvo:</span>
                  <span className="capitalize text-primary-app font-semibold">
                    {pendingValidation.details.theme}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmRestoreModal(false);
                  setPendingBackupContent(null);
                }}
                disabled={isRestoring}
                className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRestore}
                disabled={isRestoring}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider hover:bg-amber-400 transition"
              >
                {isRestoring ? 'Restaurando...' : 'Confirmar e Substituir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkpoint 01 Notice */}
      <div className="p-4 rounded-2xl bg-surface-elevated border border-white/10 flex items-start gap-3">
        <Info className="w-4 h-4 text-primary-app shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-white">TREINO CERTO — CHECKPOINT 01:</strong> Identidade visual,
          sistema de 6 temas, navegação em 5 abas, PWA e Perfil implementados com IndexedDB. Nenhum
          dado pessoal fictício está presente no banco inicial.
        </div>
      </div>
    </div>
  );
};
