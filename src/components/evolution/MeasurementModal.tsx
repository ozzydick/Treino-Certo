/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BodyMeasurementItem } from '../../types';

interface MeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: BodyMeasurementItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  initialData?: BodyMeasurementItem | null;
}

export const MeasurementModal: React.FC<MeasurementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
}) => {
  const { themeConfig } = useTheme();

  const isEditing = Boolean(initialData && initialData.id);
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(initialData?.date || todayStr);
  const [weightKg, setWeightKg] = useState<string>(
    initialData?.weightKg !== undefined ? String(initialData.weightKg) : ''
  );
  const [waistCm, setWaistCm] = useState<string>(
    initialData?.waistCm !== undefined ? String(initialData.waistCm) : ''
  );
  const [abdomenCm, setAbdomenCm] = useState<string>(
    initialData?.abdomenCm !== undefined ? String(initialData.abdomenCm) : ''
  );
  const [chestCm, setChestCm] = useState<string>(
    initialData?.chestCm !== undefined ? String(initialData.chestCm) : ''
  );
  const [armRightCm, setArmRightCm] = useState<string>(
    initialData?.armRightCm !== undefined ? String(initialData.armRightCm) : ''
  );
  const [armLeftCm, setArmLeftCm] = useState<string>(
    initialData?.armLeftCm !== undefined ? String(initialData.armLeftCm) : ''
  );
  const [thighRightCm, setThighRightCm] = useState<string>(
    initialData?.thighRightCm !== undefined ? String(initialData.thighRightCm) : ''
  );
  const [thighLeftCm, setThighLeftCm] = useState<string>(
    initialData?.thighLeftCm !== undefined ? String(initialData.thighLeftCm) : ''
  );
  const [calfRightCm, setCalfRightCm] = useState<string>(
    initialData?.calfRightCm !== undefined ? String(initialData.calfRightCm) : ''
  );
  const [calfLeftCm, setCalfLeftCm] = useState<string>(
    initialData?.calfLeftCm !== undefined ? String(initialData.calfLeftCm) : ''
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parseNum = (val: string): number | undefined => {
    if (!val || val.trim() === '') return undefined;
    const n = parseFloat(val.replace(',', '.'));
    return isNaN(n) ? undefined : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date || date.trim() === '') {
      setError('A data da avaliação é obrigatória.');
      return;
    }

    const w = parseNum(weightKg);
    const waist = parseNum(waistCm);
    const abd = parseNum(abdomenCm);
    const chest = parseNum(chestCm);
    const ar = parseNum(armRightCm);
    const al = parseNum(armLeftCm);
    const tr = parseNum(thighRightCm);
    const tl = parseNum(thighLeftCm);
    const cr = parseNum(calfRightCm);
    const cl = parseNum(calfLeftCm);

    if (
      w === undefined &&
      waist === undefined &&
      abd === undefined &&
      chest === undefined &&
      ar === undefined &&
      al === undefined &&
      tr === undefined &&
      tl === undefined &&
      cr === undefined &&
      cl === undefined
    ) {
      setError('Informe ao menos uma medida corporal para registrar a avaliação.');
      return;
    }

    try {
      setIsSubmitting(true);
      const item: BodyMeasurementItem = {
        id: initialData?.id || `measurement_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date,
        weightKg: w,
        waistCm: waist,
        abdomenCm: abd,
        chestCm: chest,
        armRightCm: ar,
        armLeftCm: al,
        thighRightCm: tr,
        thighLeftCm: tl,
        calfRightCm: cr,
        calfLeftCm: cl,
        notes: notes.trim() || undefined,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(item);
      onClose();
    } catch (err) {
      setError('Erro ao salvar avaliação física. Tente novamente.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    try {
      setIsSubmitting(true);
      await onDelete(initialData.id);
      onClose();
    } catch (err) {
      setError('Erro ao excluir avaliação.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-[#0F141C] border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Editar Avaliação Física' : 'Nova Avaliação Física'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registro real de medidas corporais e evolução física
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-app" />
              <span>Data da Avaliação *</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Peso Corporal (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="350"
              placeholder="Ex: 82.5"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
            />
          </div>

          {/* Tronco */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Tronco & Core (cm)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Cintura</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Abdômen</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={abdomenCm}
                  onChange={(e) => setAbdomenCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Peito / Tórax</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Braços */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Membros Superiores (cm)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Braço Direito</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={armRightCm}
                  onChange={(e) => setArmRightCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Braço Esquerdo</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={armLeftCm}
                  onChange={(e) => setArmLeftCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Membros Inferiores */}
          <div className="pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Membros Inferiores (cm)
            </span>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Coxa Direita</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={thighRightCm}
                  onChange={(e) => setThighRightCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Coxa Esquerda</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={thighLeftCm}
                  onChange={(e) => setThighLeftCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Panturrilha Direita</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={calfRightCm}
                  onChange={(e) => setCalfRightCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Panturrilha Esquerda</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={calfLeftCm}
                  onChange={(e) => setCalfLeftCm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-sm text-white focus:outline-none focus:border-primary-app transition placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Observações Opcionais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Medições realizadas pela manhã em jejum."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-white/10 text-xs text-white focus:outline-none focus:border-primary-app transition resize-none placeholder:text-slate-600"
            />
          </div>

          <p className="text-[10px] text-slate-500 italic leading-relaxed pt-1">
            * O TREINO CERTO não prescreve diagnósticos médicos. Registre apenas valores reais para acompanhamento pessoal.
          </p>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            {isEditing && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-surface-elevated border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-black transition flex items-center gap-1.5"
                style={{
                  backgroundColor: themeConfig.primaryHex,
                  boxShadow: `0 2px 10px rgba(${themeConfig.rgb}, 0.3)`,
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Salvar Alterações' : 'Salvar Avaliação'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
