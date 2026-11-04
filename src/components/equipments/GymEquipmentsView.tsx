/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Dumbbell,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Info,
  Camera,
  Upload,
  Eye,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useEquipments } from '../../context/EquipmentsContext';
import {
  EquipmentCategory,
  EQUIPMENT_CATEGORY_LABELS,
  GymEquipmentItem,
} from '../../types';
import {
  DEFAULT_EQUIPMENTS_CATALOG,
  ORDERED_CATEGORIES,
  normalizeEquipmentName,
} from '../../constants/equipmentsCatalog';
import { EquipmentIllustration } from './EquipmentIllustration';
import { EquipmentDetailModal } from './EquipmentDetailModal';
import { compressImageFile } from '../../services/mediaDb';

interface Props {
  onBack: () => void;
}

type FilterTab = 'all' | 'selected' | 'custom' | EquipmentCategory;

export const GymEquipmentsView: React.FC<Props> = ({ onBack }) => {
  const { themeConfig } = useTheme();
  const { profile } = useUser();
  const {
    equipments,
    photosMap,
    isLoading,
    error: contextError,
    totalSelectedCount,
    customEquipments,
    isEquipmentSelected,
    toggleSelection,
    addCustomEquipment,
    updateCustomEquipment,
    deleteCustomEquipment,
    saveEquipmentPhoto,
    deleteEquipmentPhoto,
    clearAllSelections,
  } = useEquipments();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // Equipment Detail Modal state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<GymEquipmentItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Custom equipment modal state (Add / Edit)
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GymEquipmentItem | null>(null);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<EquipmentCategory>('chest');
  const [customPhotoDataUrl, setCustomPhotoDataUrl] = useState<string | null>(null);
  const [customFormError, setCustomFormError] = useState<string | null>(null);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const customGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const customCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Deletion confirmation modal
  const [itemToDelete, setItemToDelete] = useState<GymEquipmentItem | null>(null);

  // Clear all selections confirmation modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Transient feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 2800);
  };

  // Combine standard catalog items with custom items
  const combinedCatalogList = useMemo(() => {
    // Standard catalog items formatted
    const standardItems: GymEquipmentItem[] = DEFAULT_EQUIPMENTS_CATALOG.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      isCustom: false,
      createdAt: '',
    }));

    // User's custom items
    return [...standardItems, ...customEquipments];
  }, [customEquipments]);

  // Filtered equipments based on active tab and search
  const filteredEquipments = useMemo(() => {
    const normalizedQuery = normalizeEquipmentName(searchTerm);

    return combinedCatalogList.filter((item) => {
      // 1. Text Search matching
      if (normalizedQuery) {
        const itemNormalized = normalizeEquipmentName(item.name);
        if (!itemNormalized.includes(normalizedQuery)) {
          return false;
        }
      }

      // 2. Tab Filter
      if (activeTab === 'all') return true;
      if (activeTab === 'selected') return isEquipmentSelected(item.id);
      if (activeTab === 'custom') return Boolean(item.isCustom);
      return item.category === activeTab;
    });
  }, [combinedCatalogList, searchTerm, activeTab, isEquipmentSelected]);

  // Open detail modal for any equipment (standard or custom)
  // IMPORTANTE: Não altera o status de seleção do equipamento
  const handleOpenDetail = (item: GymEquipmentItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedItemForDetail(item);
    setIsDetailModalOpen(true);
  };

  // Open modal for new custom equipment
  const handleOpenAddCustom = () => {
    setEditingItem(null);
    setCustomName('');
    setCustomCategory('chest');
    setCustomPhotoDataUrl(null);
    setCustomFormError(null);
    setIsCustomModalOpen(true);
  };

  // Open modal for editing existing custom equipment
  const handleOpenEditCustom = (item: GymEquipmentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setCustomName(item.name);
    setCustomCategory(item.category);
    setCustomPhotoDataUrl(photosMap[item.id] || null);
    setCustomFormError(null);
    setIsCustomModalOpen(true);
  };

  // Photo file selector for custom equipment creation/edit
  const handleCustomPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith('image/')) {
        setCustomFormError('Selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
        return;
      }
      const compressed = await compressImageFile(file);
      setCustomPhotoDataUrl(compressed);
      setCustomFormError(null);
    } catch {
      setCustomFormError('Falha ao processar a imagem selecionada.');
    } finally {
      e.target.value = '';
    }
  };

  // Save custom equipment (Add or Update)
  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCustom(true);
    setCustomFormError(null);

    try {
      if (editingItem) {
        // Update existing (passing customPhotoDataUrl if changed or removed)
        const res = await updateCustomEquipment(
          editingItem.id,
          customName,
          customCategory,
          customPhotoDataUrl ?? ''
        );
        if (!res.success) {
          setCustomFormError(res.error || 'Erro ao atualizar.');
          return;
        }
        setIsCustomModalOpen(false);
        showToast('Equipamento personalizado atualizado com sucesso.');
      } else {
        // Create new (with photo if provided)
        const res = await addCustomEquipment(
          customName,
          customCategory,
          customPhotoDataUrl || undefined
        );
        if (!res.success) {
          setCustomFormError(res.error || 'Erro ao cadastrar.');
          return;
        }
        setIsCustomModalOpen(false);
        showToast('Equipamento personalizado cadastrado e adicionado à academia.');
      }
    } catch {
      setCustomFormError('Falha de persistência no banco de dados local.');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // Confirm delete custom equipment
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteCustomEquipment(itemToDelete.id);
      setItemToDelete(null);
      showToast('Equipamento personalizado removido.');
    } catch {
      showToast('Erro ao remover equipamento.', 'info');
    }
  };

  // Confirm clear all selections
  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await clearAllSelections();
      setIsClearModalOpen(false);
      showToast('Seleção de equipamentos limpa com sucesso.');
    } catch {
      showToast('Erro ao limpar seleção.', 'info');
    } finally {
      setIsClearing(false);
    }
  };

  // Toggle selection with smooth feedback
  const handleToggle = async (item: GymEquipmentItem) => {
    try {
      const willBeSelected = !isEquipmentSelected(item.id);
      await toggleSelection({
        id: item.id,
        name: item.name,
        category: item.category,
        isCustom: item.isCustom,
      });
      if (willBeSelected) {
        showToast(`"${item.name}" adicionado à sua academia.`);
      } else {
        showToast(`"${item.name}" desmarcado.`);
      }
    } catch {
      showToast('Erro ao sincronizar com o banco local.', 'info');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 pb-28 space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {feedbackToast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-card border border-white/10 shadow-2xl text-xs font-medium text-slate-100 animate-in fade-in slide-in-from-top duration-150"
        >
          <CheckCircle2 className="w-4 h-4" style={{ color: themeConfig.primaryHex }} />
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition py-1 px-2 -ml-2 rounded hover:bg-white/5"
            aria-label="Voltar para a tela anterior"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          {/* Slogan or subtle badge */}
          <span className="text-[11px] text-slate-500 font-medium">
            Checkpoint 02 · Catálogo
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Dumbbell className="w-7 h-7" style={{ color: themeConfig.primaryHex }} />
              <span>Minha Academia</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {profile.gymName && profile.gymName.trim()
                  ? profile.gymName
                  : 'Selecione os equipamentos disponíveis no seu local de treino'}
              </span>
            </p>
          </div>

          {/* Quick Actions: Add Custom & Clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAddCustom}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition active:scale-95"
              style={{ backgroundColor: themeConfig.primaryHex }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Personalizado</span>
            </button>

            {totalSelectedCount > 0 && (
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-card border border-white/10 hover:border-red-500/40 hover:text-red-400 text-xs font-medium text-slate-400 transition"
                title="Limpar todos os equipamentos selecionados"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar seleção</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Counter Banner */}
        <div className="p-3 rounded-xl bg-surface-card border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: themeConfig.primaryHex }}
            />
            <span className="text-xs text-slate-300">
              <strong className="text-white text-sm font-black mr-1">
                {totalSelectedCount}
              </strong>
              {totalSelectedCount === 1
                ? 'equipamento selecionado na sua academia'
                : 'equipamentos selecionados na sua academia'}
            </span>
          </div>

          {totalSelectedCount > 0 && activeTab !== 'selected' && (
            <button
              onClick={() => setActiveTab('selected')}
              className="text-[11px] font-semibold hover:underline"
              style={{ color: themeConfig.primaryHex }}
            >
              Ver selecionados
            </button>
          )}
        </div>
      </div>

      {/* Error alert from context if any */}
      {contextError && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{contextError}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar equipamento (ex: supino, leg press, esteira...)"
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-surface-card border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-white/30 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            aria-label="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs / Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {/* All Tab */}
        <button
          onClick={() => setActiveTab('all')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'all'
              ? 'text-white'
              : 'text-slate-400 hover:text-white bg-surface-card border border-white/5'
          }`}
          style={activeTab === 'all' ? { backgroundColor: themeConfig.primaryHex } : undefined}
        >
          Todos ({combinedCatalogList.length})
        </button>

        {/* Selected Tab */}
        <button
          onClick={() => setActiveTab('selected')}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'selected'
              ? 'text-white'
              : 'text-slate-400 hover:text-white bg-surface-card border border-white/5'
          }`}
          style={activeTab === 'selected' ? { backgroundColor: themeConfig.primaryHex } : undefined}
        >
          Selecionados ({totalSelectedCount})
        </button>

        {/* Custom Tab if user has any custom items */}
        {customEquipments.length > 0 && (
          <button
            onClick={() => setActiveTab('custom')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'custom'
                ? 'text-white'
                : 'text-slate-400 hover:text-white bg-surface-card border border-white/5'
            }`}
            style={activeTab === 'custom' ? { backgroundColor: themeConfig.primaryHex } : undefined}
          >
            Personalizados ({customEquipments.length})
          </button>
        )}

        {/* Category-specific Tabs */}
        {ORDERED_CATEGORIES.map((catKey) => {
          const countInCat = combinedCatalogList.filter((item) => item.category === catKey).length;
          const isSelectedTab = activeTab === catKey;

          return (
            <button
              key={catKey}
              onClick={() => setActiveTab(catKey)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isSelectedTab
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white bg-surface-card border border-white/5'
              }`}
              style={isSelectedTab ? { backgroundColor: themeConfig.primaryHex } : undefined}
            >
              {EQUIPMENT_CATEGORY_LABELS[catKey]} ({countInCat})
            </button>
          );
        })}
      </div>

      {/* Equipment List Section */}
      {isLoading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-16 rounded-xl bg-surface-card border border-white/5 animate-pulse"
            />
          ))}
        </div>
      ) : filteredEquipments.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-surface-card border border-white/10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-elevated mx-auto flex items-center justify-center text-slate-400">
            {searchTerm ? <Search className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {searchTerm
                ? 'Nenhum equipamento encontrado'
                : activeTab === 'selected'
                ? 'Nenhum equipamento selecionado'
                : 'Nenhum equipamento nesta categoria'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `Não encontramos resultados para "${searchTerm}". Tente buscar por outro termo ou cadastre um equipamento personalizado.`
                : activeTab === 'selected'
                ? 'Selecione os aparelhos disponíveis na sua academia clicando nos itens da lista.'
                : 'Você pode adicionar um equipamento personalizado caso sua academia possua algum modelo específico.'}
            </p>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-2">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-white/10 text-xs font-medium text-slate-300 hover:text-white"
              >
                Limpar pesquisa
              </button>
            )}
            <button
              onClick={handleOpenAddCustom}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: themeConfig.primaryHex }}
            >
              + Adicionar personalizado
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEquipments.map((item) => {
            const selected = isEquipmentSelected(item.id);
            const categoryLabel = EQUIPMENT_CATEGORY_LABELS[item.category] || item.category;

            return (
              <div
                key={item.id}
                onClick={() => handleToggle(item)}
                role="checkbox"
                aria-checked={selected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    handleToggle(item);
                  }
                }}
                className={`group relative p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selected
                    ? 'bg-surface-elevated/90 shadow-sm'
                    : 'bg-surface-card border-white/5 hover:border-white/15'
                }`}
                style={
                  selected
                    ? {
                        borderColor: themeConfig.primaryHex,
                        boxShadow: `0 0 0 1px ${themeConfig.primaryHex}20`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Selection indicator checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                      selected ? 'text-white' : 'border-white/20 bg-surface-dark'
                    }`}
                    style={selected ? { backgroundColor: themeConfig.primaryHex, borderColor: themeConfig.primaryHex } : undefined}
                  >
                    {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  {/* Thumbnail de Identificação Visual (toque abre os detalhes sem alterar seleção) */}
                  <div
                    onClick={(e) => handleOpenDetail(item, e)}
                    className="w-13 h-13 sm:w-14 sm:h-14 shrink-0 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition shadow-sm hover:scale-105 active:scale-95 bg-surface-dark"
                    title="Toque na imagem para ver detalhes amplificados"
                  >
                    <EquipmentIllustration
                      equipmentId={item.id}
                      category={item.category}
                      name={item.name}
                      isCustom={item.isCustom}
                      customPhotoUrl={photosMap[item.id]}
                      size="sm"
                      className="w-full h-full"
                    />
                  </div>

                  {/* Nome e Categoria */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold truncate transition-colors ${
                          selected ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {item.name}
                      </span>

                      {item.isCustom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          Personalizado
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                      <span>{categoryLabel}</span>
                      <button
                        type="button"
                        onClick={(e) => handleOpenDetail(item, e)}
                        className="text-[10px] text-slate-400 hover:text-white underline underline-offset-2 flex items-center gap-0.5"
                      >
                        <Info className="w-3 h-3" />
                        <span>Detalhes</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right side actions */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => handleOpenDetail(item, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title="Abrir detalhes e foto ampliada"
                    aria-label={`Ver detalhes de ${item.name}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {item.isCustom && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditCustom(item, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                        title="Editar equipamento personalizado"
                        aria-label={`Editar ${item.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Excluir equipamento personalizado"
                        aria-label={`Excluir ${item.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Cadastrar / Editar Equipamento Personalizado */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-surface-card border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4" style={{ color: themeConfig.primaryHex }} />
                <span>
                  {editingItem ? 'Editar Equipamento Personalizado' : 'Novo Equipamento Personalizado'}
                </span>
              </h2>
              <button
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {customFormError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{customFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome do Equipamento *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Supino Inclinado Articulado Hammer"
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-white/30"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Categoria *
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as EquipmentCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-dark border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-white/30"
                >
                  {ORDERED_CATEGORIES.map((catKey) => (
                    <option key={catKey} value={catKey} className="bg-surface-dark text-white">
                      {EQUIPMENT_CATEGORY_LABELS[catKey]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Foto Real do Equipamento Personalizado */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Foto do Aparelho (Opcional)
                </label>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={customGalleryInputRef}
                  accept="image/*"
                  onChange={handleCustomPhotoFileChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={customCameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleCustomPhotoFileChange}
                  className="hidden"
                />

                {customPhotoDataUrl ? (
                  // Preview da Foto com Ações
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-surface-dark group">
                    <img
                      src={customPhotoDataUrl}
                      alt="Pré-visualização do equipamento"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => customGalleryInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/20 text-xs font-medium text-white hover:bg-black transition flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Substituir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomPhotoDataUrl(null)}
                        className="p-1.5 rounded-lg bg-red-600/80 border border-red-500/40 text-white hover:bg-red-600 transition"
                        title="Remover foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-white/90 border border-white/10 flex items-center gap-1">
                      <Camera className="w-3 h-3 text-orange-400" />
                      <span>Foto pronta para salvar</span>
                    </div>
                  </div>
                ) : (
                  // Botões para Tirar Foto ou Escolher da Galeria
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => customCameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-surface-dark border border-dashed border-white/20 hover:border-white/40 text-xs font-semibold text-slate-300 hover:text-white transition"
                    >
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span>Tirar Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => customGalleryInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 py-3 px-2 rounded-xl bg-surface-dark border border-dashed border-white/20 hover:border-white/40 text-xs font-semibold text-slate-300 hover:text-white transition"
                    >
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span>Galeria</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-elevated text-xs font-medium text-slate-300 hover:text-white transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition disabled:opacity-50"
                  style={{ backgroundColor: themeConfig.primaryHex }}
                >
                  {isSubmittingCustom
                    ? 'Salvando...'
                    : editingItem
                    ? 'Salvar Alterações'
                    : 'Cadastrar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Exclusão de Personalizado */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface-card border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Excluir Equipamento?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tem certeza que deseja excluir <strong>"{itemToDelete.name}"</strong>? Esta ação é definitiva.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-surface-elevated text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-sm transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirmação de Limpar Seleção */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-surface-card border border-white/10 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Limpar Seleção da Academia?</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Deseja desmarcar todos os {totalSelectedCount} equipamentos da sua academia?
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Os equipamentos personalizados serão mantidos no seu catálogo, apenas desmarcados da seleção.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsClearModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-elevated text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-sm transition"
              >
                {isClearing ? 'Limpando...' : 'Sim, Limpar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Detalhes e Identificação Visual Ampliada do Equipamento */}
      <EquipmentDetailModal
        item={selectedItemForDetail}
        isOpen={isDetailModalOpen}
        isSelected={selectedItemForDetail ? isEquipmentSelected(selectedItemForDetail.id) : false}
        photoUrl={selectedItemForDetail ? photosMap[selectedItemForDetail.id] : null}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedItemForDetail(null);
        }}
        onToggleSelection={async (item) => {
          await handleToggle(item);
        }}
        onSavePhoto={async (equipmentId, photoDataUrl) => {
          await saveEquipmentPhoto(equipmentId, photoDataUrl);
          showToast('Foto do equipamento atualizada.');
        }}
        onDeletePhoto={async (equipmentId) => {
          await deleteEquipmentPhoto(equipmentId);
          showToast('Foto do equipamento removida.');
        }}
      />
    </div>
  );
};
