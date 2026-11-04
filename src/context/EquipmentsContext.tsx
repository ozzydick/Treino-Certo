/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { dbService } from '../services/db';
import { EquipmentCategory, GymEquipmentItem } from '../types';
import {
  checkDuplicateEquipment,
  DEFAULT_EQUIPMENTS_CATALOG,
} from '../constants/equipmentsCatalog';
import {
  buildExplicitCustomCompatibilityMap,
  DEFAULT_EXERCISES_CATALOG,
  ExplicitCustomCompatibilityMap,
} from '../constants/exercisesCatalog';

interface EquipmentsContextType {
  equipments: GymEquipmentItem[];
  photosMap: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  totalSelectedCount: number;
  customEquipments: GymEquipmentItem[];
  explicitCustomCompatibilityMap: ExplicitCustomCompatibilityMap;
  isEquipmentSelected: (id: string) => boolean;
  toggleSelection: (item: {
    id: string;
    name: string;
    category: EquipmentCategory;
    isCustom?: boolean;
  }) => Promise<void>;
  addCustomEquipment: (
    name: string,
    category: EquipmentCategory,
    photoDataUrl?: string
  ) => Promise<{ success: boolean; error?: string; createdId?: string }>;
  updateCustomEquipment: (
    id: string,
    name: string,
    category: EquipmentCategory,
    photoDataUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCustomEquipment: (id: string) => Promise<{ success: boolean; error?: string }>;
  linkCustomEquipmentToExercise: (
    customEquipmentId: string,
    exerciseId: string,
    companionEquipmentIds?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  unlinkCustomEquipmentFromExercise: (
    customEquipmentId: string,
    exerciseId: string
  ) => Promise<{ success: boolean; error?: string }>;
  saveEquipmentPhoto: (id: string, photoDataUrl: string) => Promise<void>;
  deleteEquipmentPhoto: (id: string) => Promise<void>;
  clearAllSelections: () => Promise<void>;
  reloadEquipments: () => Promise<void>;
}

const EquipmentsContext = createContext<EquipmentsContextType | undefined>(undefined);

export const EquipmentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [equipments, setEquipments] = useState<GymEquipmentItem[]>([]);
  const [photosMap, setPhotosMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEquipmentsFromDB = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dbService.getEquipments();
      setEquipments(data);
      try {
        const photos = await dbService.getAllEquipmentPhotos();
        setPhotosMap(photos || {});
      } catch (photoErr) {
        console.warn('Falha ao carregar fotos de equipamentos:', photoErr);
      }
    } catch (err) {
      console.error('Falha ao carregar equipamentos do IndexedDB:', err);
      setError('Não foi possível carregar os equipamentos salvos no banco local.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEquipmentsFromDB();
  }, [loadEquipmentsFromDB]);

  // Considera selecionado quando isSelected !== false (registros legados sem isSelected continuam selecionados)
  const selectedIds = useMemo(() => {
    return new Set(
      equipments.filter((e) => e.isSelected !== false).map((e) => e.id)
    );
  }, [equipments]);

  // Lista de todos os equipamentos personalizados cadastrados (selecionados ou não)
  const customEquipments = useMemo(() => {
    return equipments.filter((e) => Boolean(e.isCustom));
  }, [equipments]);

  // Mapa de vínculos explícitos derivados exclusivamente dos equipamentos personalizados cadastrados
  const explicitCustomCompatibilityMap = useMemo(() => {
    return buildExplicitCustomCompatibilityMap(customEquipments);
  }, [customEquipments]);

  // Contador reflete estritamente os equipamentos selecionados
  const totalSelectedCount = selectedIds.size;

  const isEquipmentSelected = useCallback(
    (id: string) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  const toggleSelection = useCallback(
    async (item: { id: string; name: string; category: EquipmentCategory; isCustom?: boolean }) => {
      setError(null);
      const existing = equipments.find((e) => e.id === item.id);
      const isCustom = Boolean(item.isCustom ?? existing?.isCustom);
      const isCurrentlySelected = existing ? existing.isSelected !== false : false;

      try {
        if (isCustom) {
          // Equipamento personalizado: NUNCA excluir do IndexedDB ao desmarcar!
          // Apenas alterna isSelected
          const nextSelected = !isCurrentlySelected;
          const updatedCustom: GymEquipmentItem = {
            ...(existing || {
              id: item.id,
              name: item.name,
              category: item.category,
              isCustom: true,
              createdAt: new Date().toISOString(),
            }),
            isSelected: nextSelected,
            updatedAt: new Date().toISOString(),
          };

          await dbService.saveEquipment(updatedCustom);
          setEquipments((prev) => {
            const index = prev.findIndex((e) => e.id === item.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = updatedCustom;
              return updated;
            }
            return [...prev, updatedCustom];
          });
        } else {
          // Equipamento padrão: armazenado quando selecionado, excluído do DB quando desmarcado
          if (isCurrentlySelected) {
            await dbService.deleteEquipment(item.id);
            setEquipments((prev) => prev.filter((e) => e.id !== item.id));
          } else {
            const newItem: GymEquipmentItem = {
              id: item.id,
              name: item.name,
              category: item.category,
              isCustom: false,
              isSelected: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await dbService.saveEquipment(newItem);
            setEquipments((prev) => {
              if (prev.some((e) => e.id === newItem.id)) return prev;
              return [...prev, newItem];
            });
          }
        }
      } catch (err) {
        console.error('Erro ao alternar seleção de equipamento:', err);
        setError('Falha ao atualizar seleção no banco local.');
        throw err;
      }
    },
    [equipments]
  );

  const addCustomEquipment = useCallback(
    async (name: string, category: EquipmentCategory, photoDataUrl?: string) => {
      setError(null);
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { success: false, error: 'O nome do equipamento não pode ser vazio.' };
      }

      // Validação de duplicidade (case-insensitive, sem acentos, mesma categoria)
      const isDuplicate = checkDuplicateEquipment(trimmedName, category, equipments);
      if (isDuplicate) {
        return {
          success: false,
          error: `Já existe um equipamento cadastrado como "${trimmedName}" na categoria informada.`,
        };
      }

      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const newCustomItem: GymEquipmentItem = {
        id: `custom_${Date.now()}_${randomSuffix}`,
        name: trimmedName,
        category,
        isCustom: true,
        isSelected: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await dbService.saveEquipment(newCustomItem);
        if (photoDataUrl) {
          await dbService.saveEquipmentPhoto(newCustomItem.id, photoDataUrl);
          setPhotosMap((prev) => ({ ...prev, [newCustomItem.id]: photoDataUrl }));
        }
        setEquipments((prev) => [...prev, newCustomItem]);
        return { success: true, createdId: newCustomItem.id };
      } catch (err) {
        console.error('Erro ao salvar equipamento personalizado:', err);
        return { success: false, error: 'Erro ao gravar equipamento no IndexedDB.' };
      }
    },
    [equipments]
  );

  const updateCustomEquipment = useCallback(
    async (id: string, name: string, category: EquipmentCategory, photoDataUrl?: string) => {
      setError(null);
      const trimmedName = name.trim();
      if (!trimmedName) {
        return { success: false, error: 'O nome do equipamento não pode ser vazio.' };
      }

      // Validação de duplicidade excluindo o próprio ID
      const isDuplicate = checkDuplicateEquipment(trimmedName, category, equipments, id);
      if (isDuplicate) {
        return {
          success: false,
          error: `Já existe outro equipamento cadastrado como "${trimmedName}" na categoria informada.`,
        };
      }

      const existing = equipments.find((e) => e.id === id);
      if (!existing) {
        return { success: false, error: 'Equipamento não encontrado para edição.' };
      }

      const updatedItem: GymEquipmentItem = {
        ...existing,
        name: trimmedName,
        category,
        isSelected: existing.isSelected !== false,
        updatedAt: new Date().toISOString(),
      };

      try {
        await dbService.saveEquipment(updatedItem);
        if (photoDataUrl !== undefined) {
          if (photoDataUrl === '') {
            await dbService.deleteEquipmentPhoto(id);
            setPhotosMap((prev) => {
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
          } else {
            await dbService.saveEquipmentPhoto(id, photoDataUrl);
            setPhotosMap((prev) => ({ ...prev, [id]: photoDataUrl }));
          }
        }
        setEquipments((prev) => prev.map((e) => (e.id === id ? updatedItem : e)));
        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar equipamento personalizado:', err);
        return { success: false, error: 'Erro ao atualizar equipamento no IndexedDB.' };
      }
    },
    [equipments]
  );

  const saveEquipmentPhoto = useCallback(async (id: string, photoDataUrl: string) => {
    try {
      await dbService.saveEquipmentPhoto(id, photoDataUrl);
      setPhotosMap((prev) => ({ ...prev, [id]: photoDataUrl }));
    } catch (err) {
      console.error('Erro ao salvar foto de equipamento:', err);
      throw err;
    }
  }, []);

  const deleteEquipmentPhoto = useCallback(async (id: string) => {
    try {
      await dbService.deleteEquipmentPhoto(id);
      setPhotosMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error('Erro ao excluir foto de equipamento:', err);
      throw err;
    }
  }, []);

  const deleteCustomEquipment = useCallback(
    async (id: string) => {
      setError(null);
      try {
        await dbService.deleteEquipment(id);
        try {
          await dbService.deleteEquipmentPhoto(id);
          setPhotosMap((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        } catch {
          // ignore photo removal error
        }
        setEquipments((prev) => prev.filter((e) => e.id !== id));
        return { success: true };
      } catch (err) {
        console.error('Erro ao excluir equipamento personalizado:', err);
        return { success: false, error: 'Erro ao remover equipamento do IndexedDB.' };
      }
    },
    []
  );

  const linkCustomEquipmentToExercise = useCallback(
    async (
      customEquipmentId: string,
      exerciseId: string,
      companionEquipmentIds?: string[]
    ) => {
      setError(null);
      const existing = equipments.find((e) => e.id === customEquipmentId && e.isCustom === true);
      if (!existing) {
        return {
          success: false,
          error: 'Equipamento personalizado não encontrado ou não registrado.',
        };
      }

      const validExercise = DEFAULT_EXERCISES_CATALOG.some((ex) => ex.id === exerciseId);
      if (!validExercise) {
        return {
          success: false,
          error: 'Exercício não encontrado no catálogo oficial.',
        };
      }

      const validStandardIds = new Set(DEFAULT_EQUIPMENTS_CATALOG.map((item) => item.id));
      const validCustomIds = new Set(
        equipments.filter((e) => e.isCustom === true).map((e) => e.id)
      );

      let nextLinkedExerciseIds = Array.isArray(existing.linkedExerciseIds)
        ? [...existing.linkedExerciseIds]
        : [];
      let nextLinkedExerciseAlternatives: Record<string, string[][]> = existing.linkedExerciseAlternatives
        ? { ...existing.linkedExerciseAlternatives }
        : {};

      if (Array.isArray(companionEquipmentIds) && companionEquipmentIds.length > 0) {
        const cleanCompanions = companionEquipmentIds
          .filter((id) => typeof id === 'string' && id.trim().length > 0)
          .map((id) => id.trim());
        const allCompanionsExist = cleanCompanions.every(
          (id) => validStandardIds.has(id) || validCustomIds.has(id)
        );
        if (!allCompanionsExist) {
          return {
            success: false,
            error: 'Um ou mais equipamentos complementares da alternativa não existem.',
          };
        }
        const combo = Array.from(new Set([customEquipmentId, ...cleanCompanions]));
        const existingCombos = nextLinkedExerciseAlternatives[exerciseId] || [];
        nextLinkedExerciseAlternatives[exerciseId] = [...existingCombos, combo];
      } else {
        if (!nextLinkedExerciseIds.includes(exerciseId)) {
          nextLinkedExerciseIds.push(exerciseId);
        }
      }

      const updatedItem: GymEquipmentItem = {
        ...existing,
        linkedExerciseIds: nextLinkedExerciseIds,
        linkedExerciseAlternatives: nextLinkedExerciseAlternatives,
        updatedAt: new Date().toISOString(),
      };

      try {
        await dbService.saveEquipment(updatedItem);
        setEquipments((prev) =>
          prev.map((e) => (e.id === customEquipmentId ? updatedItem : e))
        );
        return { success: true };
      } catch (err) {
        console.error('Erro ao vincular equipamento personalizado ao exercício:', err);
        return {
          success: false,
          error: 'Erro ao salvar vínculo explícito no IndexedDB.',
        };
      }
    },
    [equipments]
  );

  const unlinkCustomEquipmentFromExercise = useCallback(
    async (customEquipmentId: string, exerciseId: string) => {
      setError(null);
      const existing = equipments.find((e) => e.id === customEquipmentId && e.isCustom === true);
      if (!existing) {
        return {
          success: false,
          error: 'Equipamento personalizado não encontrado.',
        };
      }

      const nextLinkedExerciseIds = (existing.linkedExerciseIds || []).filter(
        (id) => id !== exerciseId
      );
      const nextLinkedExerciseAlternatives = { ...(existing.linkedExerciseAlternatives || {}) };
      delete nextLinkedExerciseAlternatives[exerciseId];

      const updatedItem: GymEquipmentItem = {
        ...existing,
        linkedExerciseIds: nextLinkedExerciseIds,
        linkedExerciseAlternatives: nextLinkedExerciseAlternatives,
        updatedAt: new Date().toISOString(),
      };

      try {
        await dbService.saveEquipment(updatedItem);
        setEquipments((prev) =>
          prev.map((e) => (e.id === customEquipmentId ? updatedItem : e))
        );
        return { success: true };
      } catch (err) {
        console.error('Erro ao remover vínculo de equipamento personalizado:', err);
        return {
          success: false,
          error: 'Erro ao remover vínculo do IndexedDB.',
        };
      }
    },
    [equipments]
  );

  const clearAllSelections = useCallback(async () => {
    setError(null);
    try {
      const preservedCustoms = await dbService.clearSelectionsPreservingCustom();
      setEquipments(preservedCustoms);
    } catch (err) {
      console.error('Erro ao limpar seleção de equipamentos:', err);
      setError('Falha ao limpar equipamentos no IndexedDB.');
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      equipments,
      photosMap,
      isLoading,
      error,
      selectedIds,
      totalSelectedCount,
      customEquipments,
      explicitCustomCompatibilityMap,
      isEquipmentSelected,
      toggleSelection,
      addCustomEquipment,
      updateCustomEquipment,
      deleteCustomEquipment,
      linkCustomEquipmentToExercise,
      unlinkCustomEquipmentFromExercise,
      saveEquipmentPhoto,
      deleteEquipmentPhoto,
      clearAllSelections,
      reloadEquipments: loadEquipmentsFromDB,
    }),
    [
      equipments,
      photosMap,
      isLoading,
      error,
      selectedIds,
      totalSelectedCount,
      customEquipments,
      explicitCustomCompatibilityMap,
      isEquipmentSelected,
      toggleSelection,
      addCustomEquipment,
      updateCustomEquipment,
      deleteCustomEquipment,
      linkCustomEquipmentToExercise,
      unlinkCustomEquipmentFromExercise,
      saveEquipmentPhoto,
      deleteEquipmentPhoto,
      clearAllSelections,
      loadEquipmentsFromDB,
    ]
  );

  return <EquipmentsContext.Provider value={value}>{children}</EquipmentsContext.Provider>;
};

export const useEquipments = (): EquipmentsContextType => {
  const context = useContext(EquipmentsContext);
  if (!context) {
    throw new Error('useEquipments deve ser utilizado dentro de um EquipmentsProvider.');
  }
  return context;
};
