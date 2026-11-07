/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { dbService, safeLocalStorageGet, safeLocalStorageSet } from '../services/db';
import { ExerciseItem, MuscleGroupId } from '../types';
import {
  DEFAULT_EXERCISES_CATALOG,
  ORDERED_MUSCLE_GROUPS,
} from '../constants/exercisesCatalog';

const LOCAL_STORAGE_CUSTOM_EXERCISES_KEY = 'treino_certo_custom_exercises';

interface CustomExercisesContextType {
  customExercises: ExerciseItem[];
  allExercises: ExerciseItem[];
  isLoading: boolean;
  error: string | null;
  addCustomExercise: (
    exerciseData: Omit<ExerciseItem, 'id'>,
    photoDataUrl?: string
  ) => Promise<{ success: boolean; error?: string; createdExercise?: ExerciseItem }>;
  updateCustomExercise: (
    id: string,
    updatedData: Partial<ExerciseItem>,
    photoDataUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCustomExercise: (id: string) => Promise<{ success: boolean; error?: string }>;
  getExerciseById: (id: string) => ExerciseItem | undefined;
  reloadCustomExercises: () => Promise<void>;
}

const CustomExercisesContext = createContext<CustomExercisesContextType | undefined>(
  undefined
);

export const CustomExercisesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [customExercises, setCustomExercises] = useState<ExerciseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega exercícios personalizados salvos nas preferências do IndexedDB e localStorage
  const loadCustomExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let loaded: ExerciseItem[] = [];

      // Try reading from IndexedDB user preferences
      try {
        const prefs = await dbService.getPreferences();
        if (prefs && Array.isArray(prefs.customExercises)) {
          loaded = prefs.customExercises;
        }
      } catch (dbErr) {
        console.warn('Falha ao ler exercícios personalizados do IndexedDB:', dbErr);
      }

      // Fallback to localStorage if empty
      if (loaded.length === 0) {
        const cached = safeLocalStorageGet(LOCAL_STORAGE_CUSTOM_EXERCISES_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              loaded = parsed;
            }
          } catch {
            // ignore
          }
        }
      }

      setCustomExercises(loaded);
    } catch (err) {
      console.error('Erro ao carregar exercícios personalizados:', err);
      setError('Não foi possível carregar os exercícios personalizados salvos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomExercises();
  }, [loadCustomExercises]);

  // Salva no IndexedDB e grava backup sincronizado no localStorage
  const saveCustomExercisesList = useCallback(
    async (list: ExerciseItem[]): Promise<void> => {
      safeLocalStorageSet(LOCAL_STORAGE_CUSTOM_EXERCISES_KEY, JSON.stringify(list));
      try {
        const currentPrefs = await dbService.getPreferences();
        await dbService.savePreferences({
          ...currentPrefs,
          customExercises: list,
        });
      } catch (err) {
        console.warn('Não foi possível sincronizar exercícios personalizados no IndexedDB:', err);
      }
    },
    []
  );

  // Catálogo completo unificado: Padrão + Personalizados do Usuário
  const allExercises = useMemo(() => {
    return [...DEFAULT_EXERCISES_CATALOG, ...customExercises];
  }, [customExercises]);

  const getExerciseById = useCallback(
    (id: string): ExerciseItem | undefined => {
      if (!id) return undefined;
      return allExercises.find((ex) => ex.id === id);
    },
    [allExercises]
  );

  // Validação dos dados do exercício personalizado
  const validateCustomExerciseInput = (
    data: Partial<ExerciseItem>
  ): { valid: boolean; error?: string } => {
    const name = data.name?.trim();
    if (!name || name.length < 2) {
      return { valid: false, error: 'O nome do exercício deve ter pelo menos 2 caracteres.' };
    }

    if (!data.primaryMuscleGroup || !ORDERED_MUSCLE_GROUPS.includes(data.primaryMuscleGroup)) {
      return { valid: false, error: 'Selecione um grupo muscular principal válido.' };
    }

    if (
      !data.canExecuteWithoutEquipment &&
      (!Array.isArray(data.compatibleEquipmentIds) || data.compatibleEquipmentIds.length === 0)
    ) {
      return {
        valid: false,
        error:
          'Selecione ao menos um equipamento compatível ou marque "Livre no solo (sem equipamento)".',
      };
    }

    return { valid: true };
  };

  const addCustomExercise = useCallback(
    async (
      exerciseData: Omit<ExerciseItem, 'id'>,
      photoDataUrl?: string
    ): Promise<{ success: boolean; error?: string; createdExercise?: ExerciseItem }> => {
      setError(null);

      const validation = validateCustomExerciseInput(exerciseData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const trimmedName = exerciseData.name.trim();

      // Verifica duplicidade de nome no catálogo completo (case-insensitive)
      const isDuplicate = allExercises.some(
        (ex) => ex.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (isDuplicate) {
        return {
          success: false,
          error: `Já existe um exercício cadastrado com o nome "${trimmedName}".`,
        };
      }

      const randomHash = Math.random().toString(36).substring(2, 8);
      const newId = `ex_custom_${Date.now()}_${randomHash}`;

      const newExercise: ExerciseItem = {
        ...exerciseData,
        id: newId,
        name: trimmedName,
        isCustom: true,
        shortDescription:
          exerciseData.shortDescription?.trim() ||
          `Exercício personalizado para ${exerciseData.primaryMuscleGroup}.`,
        initialPosition:
          exerciseData.initialPosition?.trim() ||
          'Posicione-se confortavelmente mantendo a postura firme e alinhada.',
        executionSteps:
          Array.isArray(exerciseData.executionSteps) && exerciseData.executionSteps.length > 0
            ? exerciseData.executionSteps.map((s) => s.trim()).filter(Boolean)
            : ['Execute o movimento com controle e amplitude biomecânica adequada.'],
        commonMistakes:
          Array.isArray(exerciseData.commonMistakes) && exerciseData.commonMistakes.length > 0
            ? exerciseData.commonMistakes.map((s) => s.trim()).filter(Boolean)
            : ['Evite acelerar excessivamente o movimento sem controle.'],
        safetyTips:
          Array.isArray(exerciseData.safetyTips) && exerciseData.safetyTips.length > 0
            ? exerciseData.safetyTips.map((s) => s.trim()).filter(Boolean)
            : ['Mantenha a respiração constante e a postura protegida.'],
        compatibleEquipmentIds: exerciseData.compatibleEquipmentIds || [],
        equipmentAlternatives: exerciseData.equipmentAlternatives || [
          exerciseData.compatibleEquipmentIds || [],
        ],
        secondaryMuscleGroups: exerciseData.secondaryMuscleGroups || [],
        externalVideoUrl: photoDataUrl ? photoDataUrl : exerciseData.externalVideoUrl,
      };

      try {
        const nextList = [...customExercises, newExercise];
        await saveCustomExercisesList(nextList);
        setCustomExercises(nextList);
        return { success: true, createdExercise: newExercise };
      } catch (err) {
        console.error('Erro ao salvar exercício personalizado:', err);
        return { success: false, error: 'Falha ao salvar o exercício no banco de dados local.' };
      }
    },
    [allExercises, customExercises, saveCustomExercisesList]
  );

  const updateCustomExercise = useCallback(
    async (
      id: string,
      updatedData: Partial<ExerciseItem>,
      photoDataUrl?: string
    ): Promise<{ success: boolean; error?: string }> => {
      setError(null);

      const existingIndex = customExercises.findIndex((ex) => ex.id === id);
      if (existingIndex < 0) {
        return { success: false, error: 'Exercício personalizado não localizado para edição.' };
      }

      const existing = customExercises[existingIndex];
      const merged: ExerciseItem = {
        ...existing,
        ...updatedData,
        id,
        isCustom: true,
      };

      if (updatedData.name !== undefined) {
        const trimmedName = updatedData.name.trim();
        const isDuplicate = allExercises.some(
          (ex) => ex.id !== id && ex.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
          return {
            success: false,
            error: `Já existe outro exercício cadastrado com o nome "${trimmedName}".`,
          };
        }
        merged.name = trimmedName;
      }

      if (photoDataUrl !== undefined) {
        merged.externalVideoUrl = photoDataUrl || undefined;
      }

      try {
        const nextList = [...customExercises];
        nextList[existingIndex] = merged;
        await saveCustomExercisesList(nextList);
        setCustomExercises(nextList);
        return { success: true };
      } catch (err) {
        console.error('Erro ao atualizar exercício personalizado:', err);
        return { success: false, error: 'Falha ao atualizar o exercício localmente.' };
      }
    },
    [allExercises, customExercises, saveCustomExercisesList]
  );

  const deleteCustomExercise = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      setError(null);
      const existing = customExercises.find((ex) => ex.id === id);
      if (!existing) {
        return { success: false, error: 'Exercício personalizado não localizado.' };
      }

      try {
        const nextList = customExercises.filter((ex) => ex.id !== id);
        await saveCustomExercisesList(nextList);
        setCustomExercises(nextList);
        return { success: true };
      } catch (err) {
        console.error('Erro ao excluir exercício personalizado:', err);
        return { success: false, error: 'Falha ao excluir o exercício do banco local.' };
      }
    },
    [customExercises, saveCustomExercisesList]
  );

  const value = useMemo(
    () => ({
      customExercises,
      allExercises,
      isLoading,
      error,
      addCustomExercise,
      updateCustomExercise,
      deleteCustomExercise,
      getExerciseById,
      reloadCustomExercises: loadCustomExercises,
    }),
    [
      customExercises,
      allExercises,
      isLoading,
      error,
      addCustomExercise,
      updateCustomExercise,
      deleteCustomExercise,
      getExerciseById,
      loadCustomExercises,
    ]
  );

  return (
    <CustomExercisesContext.Provider value={value}>
      {children}
    </CustomExercisesContext.Provider>
  );
};

export const useCustomExercises = (): CustomExercisesContextType => {
  const context = useContext(CustomExercisesContext);
  if (!context) {
    throw new Error('useCustomExercises deve ser utilizado dentro de um CustomExercisesProvider.');
  }
  return context;
};
