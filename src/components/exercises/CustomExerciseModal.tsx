/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  Check,
  Dumbbell,
  FileText,
  Info,
  Layers,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEquipments } from '../../context/EquipmentsContext';
import { useCustomExercises } from '../../context/CustomExercisesContext';
import { ExerciseItem, MUSCLE_GROUP_LABELS, MuscleGroupId } from '../../types';
import { DEFAULT_EQUIPMENTS_CATALOG } from '../../constants/equipmentsCatalog';
import { ORDERED_MUSCLE_GROUPS } from '../../constants/exercisesCatalog';

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseToEdit?: ExerciseItem | null;
  onSaved?: (exercise: ExerciseItem) => void;
}

export const CustomExerciseModal: React.FC<CustomExerciseModalProps> = ({
  isOpen,
  onClose,
  exerciseToEdit,
  onSaved,
}) => {
  const { themeConfig } = useTheme();
  const { customEquipments } = useEquipments();
  const { addCustomExercise, updateCustomExercise, deleteCustomExercise } =
    useCustomExercises();

  // Form State
  const [name, setName] = useState('');
  const [primaryMuscleGroup, setPrimaryMuscleGroup] = useState<MuscleGroupId>('peito');
  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<MuscleGroupId[]>([]);
  const [executionType, setExecutionType] = useState<'equipment' | 'bodyweight' | 'free'>('equipment');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [initialPosition, setInitialPosition] = useState('');
  const [executionStepsText, setExecutionStepsText] = useState('');
  const [commonMistakesText, setCommonMistakesText] = useState('');
  const [safetyTipsText, setSafetyTipsText] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [externalVideoUrl, setExternalVideoUrl] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Combina equipamentos do catálogo padrão com os equipamentos personalizados da academia
  const availableEquipments = React.useMemo(() => {
    const standard = DEFAULT_EQUIPMENTS_CATALOG.map((e) => ({
      id: e.id,
      name: e.name,
      isCustom: false,
    }));
    const custom = customEquipments.map((e) => ({
      id: e.id,
      name: e.name,
      isCustom: true,
    }));
    return [...standard, ...custom];
  }, [customEquipments]);

  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setShowConfirmDelete(false);

      if (exerciseToEdit) {
        setName(exerciseToEdit.name || '');
        setPrimaryMuscleGroup(exerciseToEdit.primaryMuscleGroup || 'peito');
        setSecondaryMuscleGroups(exerciseToEdit.secondaryMuscleGroups || []);
        
        if (exerciseToEdit.canExecuteWithoutEquipment) {
          setExecutionType('free');
        } else if (exerciseToEdit.isBodyweight) {
          setExecutionType('bodyweight');
        } else {
          setExecutionType('equipment');
        }

        setSelectedEquipmentIds(exerciseToEdit.compatibleEquipmentIds || []);
        setShortDescription(exerciseToEdit.shortDescription || '');
        setInitialPosition(exerciseToEdit.initialPosition || '');
        setExecutionStepsText(
          Array.isArray(exerciseToEdit.executionSteps)
            ? exerciseToEdit.executionSteps.join('\n')
            : ''
        );
        setCommonMistakesText(
          Array.isArray(exerciseToEdit.commonMistakes)
            ? exerciseToEdit.commonMistakes.join('\n')
            : ''
        );
        setSafetyTipsText(
          Array.isArray(exerciseToEdit.safetyTips)
            ? exerciseToEdit.safetyTips.join('\n')
            : ''
        );

        if (
          exerciseToEdit.externalVideoUrl &&
          exerciseToEdit.externalVideoUrl.startsWith('data:image/')
        ) {
          setPhotoDataUrl(exerciseToEdit.externalVideoUrl);
          setExternalVideoUrl('');
        } else {
          setPhotoDataUrl('');
          setExternalVideoUrl(exerciseToEdit.externalVideoUrl || '');
        }
      } else {
        // Form reseting for new exercise
        setName('');
        setPrimaryMuscleGroup('peito');
        setSecondaryMuscleGroups([]);
        setExecutionType('equipment');
        setSelectedEquipmentIds([]);
        setShortDescription('');
        setInitialPosition('');
        setExecutionStepsText('');
        setCommonMistakesText('');
        setSafetyTipsText('');
        setPhotoDataUrl('');
        setExternalVideoUrl('');
      }
    }
  }, [isOpen, exerciseToEdit]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Por favor selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
        setFormError(null);
      }
    };
    reader.onerror = () => {
      setFormError('Erro ao ler a imagem selecionada.');
    };
    reader.readAsDataURL(file);
  };

  const toggleSecondaryGroup = (group: MuscleGroupId) => {
    setSecondaryMuscleGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const toggleEquipmentSelection = (eqId: string) => {
    setSelectedEquipmentIds((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Informe o nome do exercício.');
      return;
    }

    if (executionType === 'equipment' && selectedEquipmentIds.length === 0) {
      setFormError('Selecione ao menos um equipamento compatível ou selecione "Livre no solo".');
      return;
    }

    setIsSubmitting(true);

    const steps = executionStepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const mistakes = commonMistakesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const tips = safetyTipsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Omit<ExerciseItem, 'id'> = {
      name: trimmedName,
      primaryMuscleGroup,
      secondaryMuscleGroups,
      compatibleEquipmentIds: executionType === 'free' ? [] : selectedEquipmentIds,
      equipmentAlternatives:
        executionType === 'free'
          ? []
          : selectedEquipmentIds.map((id) => [id]),
      isBodyweight: executionType === 'bodyweight',
      canExecuteWithoutEquipment: executionType === 'free',
      shortDescription:
        shortDescription.trim() ||
        `Exercício de ${MUSCLE_GROUP_LABELS[primaryMuscleGroup].toLowerCase()} cadastrado pelo usuário.`,
      initialPosition:
        initialPosition.trim() ||
        'Posicione-se confortavelmente mantendo a postura alinhada.',
      executionSteps:
        steps.length > 0
          ? steps
          : ['Execute o movimento mantendo controle muscular e padrão respiratório adequado.'],
      commonMistakes:
        mistakes.length > 0
          ? mistakes
          : ['Movimento desalinhado ou perda de controle durante a execução.'],
      safetyTips:
        tips.length > 0 ? tips : ['Respeite os limites articulares e a carga adequada.'],
      externalVideoUrl: externalVideoUrl.trim() || undefined,
    };

    try {
      if (exerciseToEdit) {
        const result = await updateCustomExercise(exerciseToEdit.id, payload, photoDataUrl);
        if (result.success) {
          if (onSaved) onSaved({ ...payload, id: exerciseToEdit.id, isCustom: true });
          onClose();
        } else {
          setFormError(result.error || 'Erro ao atualizar exercício.');
        }
      } else {
        const result = await addCustomExercise(payload, photoDataUrl);
        if (result.success && result.createdExercise) {
          if (onSaved) onSaved(result.createdExercise);
          onClose();
        } else {
          setFormError(result.error || 'Erro ao criar exercício.');
        }
      }
    } catch (err) {
      console.error('Erro ao salvar exercício personalizado:', err);
      setFormError('Ocorreu uma falha inesperada ao salvar o exercício.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!exerciseToEdit) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCustomExercise(exerciseToEdit.id);
      if (res.success) {
        onClose();
      } else {
        setFormError(res.error || 'Falha ao excluir o exercício.');
      }
    } catch (err) {
      console.error('Erro ao excluir exercício:', err);
      setFormError('Erro ao excluir exercício personalizado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border flex items-center justify-center text-black font-bold"
              style={{ backgroundColor: themeConfig.primaryHex, borderColor: themeConfig.primaryHex }}
            >
              <Dumbbell className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {exerciseToEdit ? 'Editar Exercício Personalizado' : 'Novo Exercício Personalizado'}
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre um exercício sob medida para compor suas fichas e rotinas de treino
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Nome do Exercício */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>Nome do Exercício</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Rosca Scott na Máquina Articulada, Elevação Pelvica no Smith..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-white/30 transition"
            />
          </div>

          {/* Grupo Muscular Principal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Grupo Muscular Principal</span>
              <span className="text-red-400">*</span>
            </label>
            <select
              value={primaryMuscleGroup}
              onChange={(e) => {
                const group = e.target.value as MuscleGroupId;
                setPrimaryMuscleGroup(group);
                setSecondaryMuscleGroups((prev) => prev.filter((g) => g !== group));
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white text-sm focus:outline-none focus:border-white/30 transition"
            >
              {ORDERED_MUSCLE_GROUPS.map((groupKey) => (
                <option key={groupKey} value={groupKey} className="bg-slate-900 text-white">
                  {MUSCLE_GROUP_LABELS[groupKey]}
                </option>
              ))}
            </select>
          </div>

          {/* Grupos Musculares Secundários */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>Grupos Musculares Secundários (Opcional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ORDERED_MUSCLE_GROUPS.filter((g) => g !== primaryMuscleGroup).map((groupKey) => {
                const isSelected = secondaryMuscleGroups.includes(groupKey);
                return (
                  <button
                    key={groupKey}
                    type="button"
                    onClick={() => toggleSecondaryGroup(groupKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-slate-700 text-white border-white/20'
                        : 'bg-surface-card border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {MUSCLE_GROUP_LABELS[groupKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modo de Execução & Equipamentos */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-slate-400" />
              <span>Equipamento e Requisito da Academia</span>
              <span className="text-red-400">*</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExecutionType('equipment')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  executionType === 'equipment'
                    ? 'bg-surface-card border-white/30 text-white font-bold'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold">Exige Equipamento</span>
                <span className="text-[10px] text-slate-400 mt-1">Aparelho, polia, halter ou barra</span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionType('bodyweight')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  executionType === 'bodyweight'
                    ? 'bg-surface-card border-white/30 text-white font-bold'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold">Peso Corporal</span>
                <span className="text-[10px] text-slate-400 mt-1">Calistenia / peso próprio</span>
              </button>

              <button
                type="button"
                onClick={() => setExecutionType('free')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  executionType === 'free'
                    ? 'bg-surface-card border-white/30 text-white font-bold'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-semibold">Livre no Solo</span>
                <span className="text-[10px] text-slate-400 mt-1">Sem aparelho obrigatório</span>
              </button>
            </div>

            {/* Seletor de Equipamento quando exigido */}
            {executionType !== 'free' && (
              <div className="mt-3 p-3.5 rounded-xl bg-surface-card border border-white/10 space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Selecione os equipamentos compatíveis com este exercício:
                </span>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {availableEquipments.map((eq) => {
                    const isChecked = selectedEquipmentIds.includes(eq.id);
                    return (
                      <label
                        key={eq.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-elevated hover:bg-slate-800 cursor-pointer text-xs text-slate-200 transition"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEquipmentSelection(eq.id)}
                          className="w-4 h-4 rounded border-slate-600 text-orange-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="flex-1 font-medium">{eq.name}</span>
                        {eq.isCustom && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                            Personalizado
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Descrição e Biomecânica */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Descrição Curta (Opcional)</span>
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Ex: Exercício focado em quadríceps com ênfase na fase excêntrica."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white/30 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">Posição Inicial</label>
              <textarea
                rows={2}
                value={initialPosition}
                onChange={(e) => setInitialPosition(e.target.value)}
                placeholder="Ex: Ajuste o banco na posição vertical, apoie a coluna firmemente..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white/30 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                Passos de Execução (Um por linha)
              </label>
              <textarea
                rows={3}
                value={executionStepsText}
                onChange={(e) => setExecutionStepsText(e.target.value)}
                placeholder="1. Inspire e inicie o movimento flexionando os cotovelos&#10;2. Mantenha a contração no topo por 1 segundo&#10;3. Retorne de forma controlada à posição inicial"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white/30 transition"
              />
            </div>
          </div>

          {/* Foto ou Mídia Local Opcional */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-slate-400" />
              <span>Fotografia ou Imagem Demonstrativa (Opcional)</span>
            </label>

            {photoDataUrl ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                <img
                  src={photoDataUrl}
                  alt="Foto do exercício personalizado"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl('')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white transition"
                  title="Remover imagem"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-white/20 hover:border-white/40 bg-surface-card cursor-pointer transition text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-semibold text-slate-200">
                  Carregar imagem do dispositivo
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG ou WebP de até 5MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <LinkIcon className="w-3 h-3 text-slate-500" />
                <span>Link de Vídeo Externo (Opcional - YouTube/Vimeo)</span>
              </label>
              <input
                type="url"
                value={externalVideoUrl}
                onChange={(e) => setExternalVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-1.5 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-white/30 transition"
              />
            </div>
          </div>

          {/* Section: Confirm Delete */}
          {exerciseToEdit && showConfirmDelete && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
              <p className="text-xs font-bold text-red-300">
                Tem certeza que deseja excluir o exercício "{exerciseToEdit.name}"?
              </p>
              <p className="text-[11px] text-red-200/80">
                Esta ação é irreversível. O exercício deixará de constar na sua biblioteca.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                >
                  Confirmar Exclusão
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {exerciseToEdit && !showConfirmDelete ? (
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Exercício</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-surface-card border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] px-5 py-2 rounded-xl font-bold text-black text-xs transition flex items-center justify-center gap-2"
                style={{ backgroundColor: themeConfig.primaryHex }}
              >
                <Check className="w-4 h-4 text-black" />
                <span>{exerciseToEdit ? 'Salvar Alterações' : 'Cadastrar Exercício'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
