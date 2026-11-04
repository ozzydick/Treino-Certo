/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  X,
  Check,
  Plus,
  Trash2,
  Camera,
  Upload,
  AlertTriangle,
  Building2,
  Sparkles,
  Info,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { EquipmentCategory, EQUIPMENT_CATEGORY_LABELS, GymEquipmentItem } from '../../types';
import { getEquipmentDescription } from '../../constants/equipmentCatalogData';
import { EquipmentIllustration } from './EquipmentIllustration';
import { compressImageFile } from '../../services/mediaDb';

interface EquipmentDetailModalProps {
  item: GymEquipmentItem | null;
  isOpen: boolean;
  isSelected: boolean;
  photoUrl?: string | null;
  onClose: () => void;
  onToggleSelection: (item: GymEquipmentItem) => Promise<void>;
  onSavePhoto?: (equipmentId: string, photoDataUrl: string) => Promise<void>;
  onDeletePhoto?: (equipmentId: string) => Promise<void>;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  item,
  isOpen,
  isSelected,
  photoUrl,
  onClose,
  onToggleSelection,
  onSavePhoto,
  onDeletePhoto,
}) => {
  const { themeConfig } = useTheme();

  // Photo management state for custom equipments
  const [isManagingPhoto, setIsManagingPhoto] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !item) {
    return null;
  }

  const categoryLabel = EQUIPMENT_CATEGORY_LABELS[item.category] || item.category;
  const description = getEquipmentDescription(item.id, item.name);

  // File selection & compression handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    try {
      if (!file.type.startsWith('image/')) {
        setPhotoError('Por favor selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
        return;
      }

      const compressedDataUrl = await compressImageFile(file);
      setPreviewPhotoUrl(compressedDataUrl);
      setIsManagingPhoto(true);
    } catch {
      setPhotoError('Falha ao processar imagem para visualização.');
    } finally {
      // Reseta o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  // Confirm photo save
  const handleConfirmSavePhoto = async () => {
    if (!previewPhotoUrl || !onSavePhoto) return;
    setIsSavingPhoto(true);
    setPhotoError(null);
    try {
      await onSavePhoto(item.id, previewPhotoUrl);
      setIsManagingPhoto(false);
      setPreviewPhotoUrl(null);
    } catch {
      setPhotoError('Erro ao gravar foto localmente.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Cancel photo change
  const handleCancelPhoto = () => {
    setIsManagingPhoto(false);
    setPreviewPhotoUrl(null);
    setPhotoError(null);
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    if (!onDeletePhoto) return;
    setIsSavingPhoto(true);
    setPhotoError(null);
    try {
      await onDeletePhoto(item.id);
      setIsManagingPhoto(false);
      setPreviewPhotoUrl(null);
    } catch {
      setPhotoError('Erro ao remover foto do equipamento.');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Toggle selection inside modal
  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleSelection(item);
    } finally {
      setIsToggling(false);
    }
  };

  const currentDisplayedPhoto = previewPhotoUrl || photoUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-surface-dark/60">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${themeConfig.primaryHex}20`,
                color: themeConfig.primaryHex,
                border: `1px solid ${themeConfig.primaryHex}40`,
              }}
            >
              {categoryLabel}
            </span>
            {item.isCustom && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                Personalizado
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Fechar detalhes do equipamento"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Hero Visual Display */}
          <div className="space-y-2">
            <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden shadow-inner bg-surface-dark border border-white/10">
              <EquipmentIllustration
                equipmentId={item.id}
                category={item.category}
                name={item.name}
                isCustom={item.isCustom}
                customPhotoUrl={currentDisplayedPhoto}
                size="lg"
                className="w-full h-full"
              />

              {/* Status Badge Over Image */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-semibold">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isSelected ? 'animate-pulse' : ''
                  }`}
                  style={{
                    backgroundColor: isSelected ? themeConfig.primaryHex : '#64748B',
                  }}
                />
                <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                  {isSelected ? 'Presente na sua academia' : 'Não selecionado'}
                </span>
              </div>
            </div>

            {/* Custom Equipment Photo Actions */}
            {item.isCustom && (
              <div className="space-y-2 pt-1">
                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isManagingPhoto && previewPhotoUrl ? (
                  // Preview & Confirm Bar
                  <div className="p-3 rounded-xl bg-surface-elevated border border-white/10 space-y-2">
                    <p className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.primaryHex }} />
                      <span>Pré-visualização da nova foto:</span>
                    </p>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelPhoto}
                        className="px-3 py-1.5 rounded-lg bg-surface-card border border-white/10 text-xs font-medium text-slate-300 hover:text-white"
                      >
                        Descartar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmSavePhoto}
                        disabled={isSavingPhoto}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: themeConfig.primaryHex }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingPhoto ? 'Gravando...' : 'Confirmar Foto'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Photo action triggers
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tirar Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-elevated border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-400" />
                      <span>{photoUrl ? 'Substituir Foto' : 'Galeria'}</span>
                    </button>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-xl bg-surface-elevated border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 transition"
                        title="Remover foto do equipamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {photoError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title & Category Details */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {item.name}
            </h2>
            <p className="text-xs font-semibold mt-1" style={{ color: themeConfig.primaryHex }}>
              Grupo Muscular: {categoryLabel}
            </p>
          </div>

          {/* Functional Recognition Description */}
          <div className="p-3.5 rounded-xl bg-surface-dark border border-white/5 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Como reconhecer na academia</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Modal Bottom Actions Bar */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-surface-dark flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-surface-card border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Fechar
          </button>

          {/* Botão Independente para Alternar a Presença na Academia */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition flex items-center gap-2 active:scale-95 disabled:opacity-50"
            style={
              isSelected
                ? {
                    backgroundColor: '#1E293B',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#EF4444',
                  }
                : {
                    backgroundColor: themeConfig.primaryHex,
                  }
            }
          >
            {isSelected ? (
              <>
                <X className="w-4 h-4" />
                <span>Remover da Academia</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Adicionar à Academia</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
