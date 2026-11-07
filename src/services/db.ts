/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_THEME_ID, THEMES } from '../constants/themes';
import {
  FitnessGoal,
  GymEquipmentItem,
  ThemeId,
  UserPreferences,
  UserProfile,
  WorkoutPlanItem,
  WorkoutSessionItem,
  BodyMeasurementItem,
} from '../types';
import { MediaDB, mediaDB } from './mediaDb';

// O identificador original 'fit_app_db' é rigorosamente mantido para assegurar
// compatibilidade plena e evitar qualquer perda de dados históricos existentes.
export const DB_NAME = 'fit_app_db';
export const DB_VERSION = 1;

export const STORES = {
  PROFILE: 'profile',
  PREFERENCES: 'preferences',
  EQUIPMENTS: 'equipments',
  WORKOUT_PLANS: 'workout_plans',
  WORKOUT_SESSIONS: 'workout_sessions',
  CARDIO_SESSIONS: 'cardio_sessions',
  BODY_MEASUREMENTS: 'body_measurements',
} as const;

export const REQUIRED_STORES: readonly string[] = [
  STORES.PROFILE,
  STORES.PREFERENCES,
  STORES.EQUIPMENTS,
  STORES.WORKOUT_PLANS,
  STORES.WORKOUT_SESSIONS,
  STORES.CARDIO_SESSIONS,
  STORES.BODY_MEASUREMENTS,
];

export const VALID_GOALS: readonly FitnessGoal[] = [
  'hipertrofia',
  'emagrecimento',
  'condicionamento',
  'forca',
  'saude',
];

export interface BackupValidationResult {
  isValid: boolean;
  error?: string;
  app?: string;
  version?: string;
  details?: {
    hasProfile: boolean;
    hasPreferences: boolean;
    theme?: string;
    userName?: string;
    recordCounts: Record<string, number>;
  };
}

/**
 * Limite máximo razoável por fotografia em Data URL Base64 (~2 MB em caracteres),
 * compatível com imagens geradas por compressImageFile() e prevenindo exaustão de memória.
 */
export const MAX_MEDIA_PHOTO_DATA_URL_LENGTH = 2 * 1024 * 1024;
export const MAX_TOTAL_MEDIA_DATA_URL_LENGTH = 25 * 1024 * 1024;

const IMAGE_DATA_URL_PREFIX_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
const VALID_BASE64_CONTENT_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Valida estruturalmente se um valor é uma Data URL de imagem suportada pelo aplicativo
 * (data:image/(jpeg|jpg|png|webp);base64,...) com Base64 válido e dentro do limite de tamanho.
 */
export function validateImageDataUrl(
  value: unknown,
  equipmentId = 'desconhecido'
): { isValid: boolean; error?: string } {
  if (typeof value !== 'string' || value.trim() === '') {
    return {
      isValid: false,
      error: `Valor de fotografia inválido para o equipamento "${equipmentId}" no campo "media" (esperado texto não vazio com Data URL).`,
    };
  }

  if (value !== value.trim()) {
    return {
      isValid: false,
      error: `Valor de fotografia inválido para o equipamento "${equipmentId}" no campo "media": não deve conter espaços nas extremidades.`,
    };
  }

  if (/^https?:\/\//i.test(value)) {
    return {
      isValid: false,
      error: `URL HTTP/HTTPS não permitida para o equipamento "${equipmentId}" no campo "media": somente Data URL de imagem local (base64) é aceita.`,
    };
  }

  if (value.length > MAX_MEDIA_PHOTO_DATA_URL_LENGTH) {
    return {
      isValid: false,
      error: `Fotografia do equipamento "${equipmentId}" no campo "media" excede o limite máximo de tamanho permitido (${MAX_MEDIA_PHOTO_DATA_URL_LENGTH} caracteres).`,
    };
  }

  if (!IMAGE_DATA_URL_PREFIX_REGEX.test(value)) {
    return {
      isValid: false,
      error: `Formato de fotografia inválido para o equipamento "${equipmentId}" no campo "media": exigido prefixo "data:image/(jpeg|jpg|png|webp);base64,".`,
    };
  }

  const commaIndex = value.indexOf(',');
  const base64Body = commaIndex >= 0 ? value.slice(commaIndex + 1) : '';

  if (
    base64Body.length < 4 ||
    base64Body.length % 4 !== 0 ||
    !VALID_BASE64_CONTENT_REGEX.test(base64Body)
  ) {
    return {
      isValid: false,
      error: `Conteúdo Base64 malformado ou inválido para o equipamento "${equipmentId}" no campo "media".`,
    };
  }

  return { isValid: true };
}

/**
 * Utilitários seguros para acesso ao localStorage que nunca lançam exceções
 * mesmo em ambientes restritos, modo anônimo, cota excedida ou desabilitado.
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    console.warn(`[Storage] Falha não crítica ao ler localStorage (${key}):`, e);
  }
  return null;
}

export function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn(`[Storage] Falha não crítica ao gravar em localStorage (${key}):`, e);
  }
}

export class FitAppDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;
  private customIndexedDB: IDBFactory | null = null;
  private mediaDBInstance: MediaDB | null = null;

  /**
   * Permite injeção de factory customizada (útil para testes com fake-indexeddb).
   */
  constructor(customFactory?: IDBFactory) {
    if (customFactory) {
      this.customIndexedDB = customFactory;
      this.mediaDBInstance = new MediaDB(customFactory);
    }
  }

  public getMediaDB(): MediaDB {
    if (!this.mediaDBInstance) {
      this.mediaDBInstance = this.customIndexedDB ? new MediaDB(this.customIndexedDB) : mediaDB;
    }
    return this.mediaDBInstance;
  }

  public setFactory(factory: IDBFactory) {
    this.customIndexedDB = factory;
    if (this.mediaDBInstance) {
      this.mediaDBInstance.setFactory(factory);
    } else {
      this.mediaDBInstance = new MediaDB(factory);
    }
    this.closeConnection();
  }

  public closeConnection(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // ignore
      }
      this.db = null;
      this.initPromise = null;
    }
    if (this.mediaDBInstance) {
      this.mediaDBInstance.closeConnection();
    }
  }

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    const idbFactory =
      this.customIndexedDB ||
      (typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null);

    if (!idbFactory) {
      throw new Error('IndexedDB não está disponível neste ambiente.');
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = idbFactory.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.PROFILE)) {
          db.createObjectStore(STORES.PROFILE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
          db.createObjectStore(STORES.PREFERENCES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.EQUIPMENTS)) {
          db.createObjectStore(STORES.EQUIPMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.WORKOUT_PLANS)) {
          db.createObjectStore(STORES.WORKOUT_PLANS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.WORKOUT_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORES.WORKOUT_SESSIONS, { keyPath: 'id' });
          sessionStore.createIndex('by_date', 'startTime', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.CARDIO_SESSIONS)) {
          const cardioStore = db.createObjectStore(STORES.CARDIO_SESSIONS, { keyPath: 'id' });
          cardioStore.createIndex('by_date', 'startTime', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORES.BODY_MEASUREMENTS)) {
          db.createObjectStore(STORES.BODY_MEASUREMENTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        console.error('Erro ao inicializar IndexedDB:', request.error);
        this.initPromise = null;
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // --- Operações de Perfil ---
  public async getProfile(): Promise<UserProfile | null> {
    try {
      const db = await this.getDB();
      return await new Promise<UserProfile | null>((resolve, reject) => {
        const tx = db.transaction(STORES.PROFILE, 'readonly');
        const store = tx.objectStore(STORES.PROFILE);
        const req = store.get('current_user');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Fallback para cache local do perfil:', e);
      const cached =
        safeLocalStorageGet('treino_certo_profile') || safeLocalStorageGet('fit_app_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore
        }
      }
      return null;
    }
  }

  public async saveProfile(profile: UserProfile): Promise<void> {
    const payload: UserProfile = {
      ...profile,
      id: 'current_user',
      updatedAt: new Date().toISOString(),
    };

    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.PROFILE, 'readwrite');
      const store = tx.objectStore(STORES.PROFILE);
      store.put(payload);

      tx.oncomplete = () => {
        // Atualiza cache secundário somente após confirmação da transação principal
        safeLocalStorageSet('treino_certo_profile', JSON.stringify(payload));
        resolve();
      };

      tx.onerror = () => {
        console.error('Falha na transação ao salvar perfil:', tx.error);
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(new Error('Transação de gravação de perfil cancelada.'));
      };
    });
  }

  // --- Operações de Preferências ---
  public async getPreferences(): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      id: 'current_preferences',
      theme: DEFAULT_THEME_ID,
      soundAlerts: true,
      vibration: true,
      restTimerDefaultSeconds: 60,
      keepScreenAwake: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      const db = await this.getDB();
      const stored = await new Promise<UserPreferences | null>((resolve, reject) => {
        const tx = db.transaction(STORES.PREFERENCES, 'readonly');
        const store = tx.objectStore(STORES.PREFERENCES);
        const req = store.get('current_preferences');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });

      if (stored) return { ...defaultPrefs, ...stored };
    } catch (e) {
      console.warn('Fallback para cache local de preferências:', e);
    }

    const cached =
      safeLocalStorageGet('treino_certo_preferences') ||
      safeLocalStorageGet('fit_app_preferences');
    if (cached) {
      try {
        return { ...defaultPrefs, ...JSON.parse(cached) };
      } catch {
        // ignore
      }
    }

    return defaultPrefs;
  }

  public async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated: UserPreferences = {
      ...current,
      ...prefs,
      id: 'current_preferences',
      updatedAt: new Date().toISOString(),
    };

    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.PREFERENCES, 'readwrite');
      const store = tx.objectStore(STORES.PREFERENCES);
      store.put(updated);

      tx.oncomplete = () => {
        safeLocalStorageSet('treino_certo_preferences', JSON.stringify(updated));
        resolve();
      };

      tx.onerror = () => {
        console.error('Falha na transação ao salvar preferências:', tx.error);
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(new Error('Transação de preferências abortada.'));
      };
    });

    return updated;
  }

  // --- Operações de Equipamentos da Academia (Checkpoint 02) ---
  public async getEquipments(): Promise<GymEquipmentItem[]> {
    const db = await this.getDB();
    return new Promise<GymEquipmentItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readonly');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as GymEquipmentItem[]) || []);
      };
      req.onerror = () => {
        console.error('Erro ao recuperar equipamentos do IndexedDB:', req.error);
        reject(req.error);
      };
    });
  }

  public async saveEquipment(item: GymEquipmentItem): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readwrite');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      store.put(item);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao salvar equipamento no IndexedDB:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de gravação de equipamento abortada.'));
      };
    });
  }

  public async saveEquipments(items: GymEquipmentItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readwrite');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      for (const item of items) {
        store.put(item);
      }

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao salvar múltiplos equipamentos no IndexedDB:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de gravação de múltiplos equipamentos abortada.'));
      };
    });
  }

  public async deleteEquipment(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readwrite');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      store.delete(id);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error(`Erro ao remover equipamento (${id}) do IndexedDB:`, tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de exclusão de equipamento abortada.'));
      };
    });
  }

  public async clearEquipments(): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readwrite');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      store.clear();

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao limpar equipamentos do IndexedDB:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de limpeza de equipamentos abortada.'));
      };
    });
  }

  /**
   * Limpa seleções da academia removendo equipamentos padrão e preservando
   * todos os equipamentos personalizados no banco com isSelected: false.
   */
  public async clearSelectionsPreservingCustom(): Promise<GymEquipmentItem[]> {
    const db = await this.getDB();
    return new Promise<GymEquipmentItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.EQUIPMENTS, 'readwrite');
      const store = tx.objectStore(STORES.EQUIPMENTS);
      const req = store.getAll();

      let preservedCustoms: GymEquipmentItem[] = [];

      req.onsuccess = () => {
        const allItems = (req.result as GymEquipmentItem[]) || [];
        preservedCustoms = [];

        for (const item of allItems) {
          if (!item.isCustom) {
            store.delete(item.id);
          } else {
            const updatedCustom: GymEquipmentItem = {
              ...item,
              isSelected: false,
              updatedAt: new Date().toISOString(),
            };
            store.put(updatedCustom);
            preservedCustoms.push(updatedCustom);
          }
        }
      };

      tx.oncomplete = () => {
        resolve(preservedCustoms);
      };
      tx.onerror = () => {
        console.error('Erro ao limpar seleção preservando personalizados:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de limpeza de seleções abortada.'));
      };
    });
  }

  // --- Operações de Fichas de Treino (Checkpoint 04) ---
  public async getWorkoutPlans(): Promise<WorkoutPlanItem[]> {
    const db = await this.getDB();
    return new Promise<WorkoutPlanItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_PLANS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_PLANS);
      const req = store.getAll();
      req.onsuccess = () => {
        resolve((req.result as WorkoutPlanItem[]) || []);
      };
      req.onerror = () => {
        console.error('Erro ao buscar fichas de treino:', req.error);
        reject(req.error);
      };
    });
  }

  public async getWorkoutPlan(id: string): Promise<WorkoutPlanItem | null> {
    const db = await this.getDB();
    return new Promise<WorkoutPlanItem | null>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_PLANS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_PLANS);
      const req = store.get(id);
      req.onsuccess = () => {
        resolve((req.result as WorkoutPlanItem) || null);
      };
      req.onerror = () => {
        console.error(`Erro ao buscar ficha de treino (${id}):`, req.error);
        reject(req.error);
      };
    });
  }

  public async getActiveWorkoutPlan(): Promise<WorkoutPlanItem | null> {
    const plans = await this.getWorkoutPlans();
    if (plans.length === 0) return null;
    const active = plans.find((p) => p.isActive);
    return active || plans[0] || null;
  }

  public async saveWorkoutPlan(plan: WorkoutPlanItem): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_PLANS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_PLANS);

      if (plan.isActive) {
        // Se esta ficha for ativa, desativa as demais para garantir unicidade
        const getAllReq = store.getAll();
        getAllReq.onsuccess = () => {
          const allPlans = (getAllReq.result as WorkoutPlanItem[]) || [];
          for (const other of allPlans) {
            if (other.id !== plan.id && other.isActive) {
              store.put({ ...other, isActive: false, updatedAt: new Date().toISOString() });
            }
          }
          store.put(plan);
        };
        getAllReq.onerror = () => {
          store.put(plan);
        };
      } else {
        store.put(plan);
      }

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao salvar ficha de treino:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de gravação de ficha abortada.'));
      };
    });
  }

  public async deleteWorkoutPlan(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_PLANS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_PLANS);
      store.delete(id);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error(`Erro ao excluir ficha de treino (${id}):`, tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de exclusão de ficha abortada.'));
      };
    });
  }

  public async setActiveWorkoutPlan(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_PLANS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_PLANS);
      const req = store.getAll();

      req.onsuccess = () => {
        const plans = (req.result as WorkoutPlanItem[]) || [];
        for (const p of plans) {
          const shouldBeActive = p.id === id;
          if (p.isActive !== shouldBeActive) {
            store.put({
              ...p,
              isActive: shouldBeActive,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      };

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao ativar ficha de treino:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de ativação de ficha abortada.'));
      };
    });
  }

  // --- Operações de Sessões de Treino Executadas (Checkpoint 04) ---
  public async getWorkoutSessions(): Promise<WorkoutSessionItem[]> {
    const db = await this.getDB();
    return new Promise<WorkoutSessionItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_SESSIONS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_SESSIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const sessions = (req.result as WorkoutSessionItem[]) || [];
        // Ordena por startTime decrescente (mais recente primeiro)
        sessions.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        resolve(sessions);
      };
      req.onerror = () => {
        console.error('Erro ao buscar sessões de treino:', req.error);
        reject(req.error);
      };
    });
  }

  public async getWorkoutSession(id: string): Promise<WorkoutSessionItem | null> {
    const db = await this.getDB();
    return new Promise<WorkoutSessionItem | null>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_SESSIONS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_SESSIONS);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve((req.result as WorkoutSessionItem) || null);
      };
      req.onerror = () => {
        console.error(`Erro ao buscar sessão de treino (${id}):`, req.error);
        reject(req.error);
      };
    });
  }

  public async getActiveWorkoutSession(): Promise<WorkoutSessionItem | null> {
    const db = await this.getDB();
    return new Promise<WorkoutSessionItem | null>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_SESSIONS, 'readonly');
      const store = tx.objectStore(STORES.WORKOUT_SESSIONS);
      const req = store.getAll();

      req.onsuccess = () => {
        const sessions = (req.result as WorkoutSessionItem[]) || [];
        // Encontra a sessão não concluída mais recente
        const uncompleted = sessions
          .filter((s) => !s.isCompleted)
          .sort(
            (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );
        resolve(uncompleted[0] || null);
      };
      req.onerror = () => {
        console.error('Erro ao buscar sessão ativa:', req.error);
        reject(req.error);
      };
    });
  }

  public async saveWorkoutSession(session: WorkoutSessionItem): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_SESSIONS);
      store.put(session);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao salvar sessão de treino:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de gravação de sessão abortada.'));
      };
    });
  }

  public async deleteWorkoutSession(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.WORKOUT_SESSIONS, 'readwrite');
      const store = tx.objectStore(STORES.WORKOUT_SESSIONS);
      store.delete(id);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error(`Erro ao excluir sessão de treino (${id}):`, tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de exclusão de sessão abortada.'));
      };
    });
  }

  // --- Operações de Avaliação Física e Medidas Corporais (Checkpoint 05) ---
  public async getBodyMeasurements(): Promise<BodyMeasurementItem[]> {
    const db = await this.getDB();
    return new Promise<BodyMeasurementItem[]>((resolve, reject) => {
      const tx = db.transaction(STORES.BODY_MEASUREMENTS, 'readonly');
      const store = tx.objectStore(STORES.BODY_MEASUREMENTS);
      const req = store.getAll();

      req.onsuccess = () => {
        const measurements = (req.result as BodyMeasurementItem[]) || [];
        // Ordena por data decrescente (mais recente primeiro)
        measurements.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(measurements);
      };
      req.onerror = () => {
        console.error('Erro ao buscar medidas corporais:', req.error);
        reject(req.error);
      };
    });
  }

  public async getBodyMeasurement(id: string): Promise<BodyMeasurementItem | null> {
    const db = await this.getDB();
    return new Promise<BodyMeasurementItem | null>((resolve, reject) => {
      const tx = db.transaction(STORES.BODY_MEASUREMENTS, 'readonly');
      const store = tx.objectStore(STORES.BODY_MEASUREMENTS);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve((req.result as BodyMeasurementItem) || null);
      };
      req.onerror = () => {
        console.error(`Erro ao buscar medida corporal (${id}):`, req.error);
        reject(req.error);
      };
    });
  }

  public async saveBodyMeasurement(measurement: BodyMeasurementItem): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.BODY_MEASUREMENTS, 'readwrite');
      const store = tx.objectStore(STORES.BODY_MEASUREMENTS);
      store.put(measurement);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error('Erro ao salvar avaliação física/medida corporal:', tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de gravação de avaliação física abortada.'));
      };
    });
  }

  public async deleteBodyMeasurement(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.BODY_MEASUREMENTS, 'readwrite');
      const store = tx.objectStore(STORES.BODY_MEASUREMENTS);
      store.delete(id);

      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = () => {
        console.error(`Erro ao excluir avaliação física (${id}):`, tx.error);
        reject(tx.error);
      };
      tx.onabort = () => {
        reject(new Error('Transação de exclusão de avaliação física abortada.'));
      };
    });
  }

  // --- Exportação Consistente em Transação Única Exclusivamente com as 7 Tabelas Oficiais ---
  public async exportAllData(): Promise<string> {
    const db = await this.getDB();

    // 1. Verificar fisicamente a existência de todas as 7 tabelas oficiais
    for (const storeName of REQUIRED_STORES) {
      if (!db.objectStoreNames.contains(storeName)) {
        throw new Error(
          `Falha na exportação: a tabela oficial "${storeName}" não existe fisicamente no banco de dados.`
        );
      }
    }

    const data: Record<string, unknown[]> = {};

    // 2. Abrir uma única transação readonly exclusivamente com REQUIRED_STORES
    // (não utiliza db.objectStoreNames para não incluir tabelas adicionais eventualmente existentes)
    await new Promise<void>((resolve, reject) => {
      let isSettled = false;
      const tx = db.transaction(REQUIRED_STORES, 'readonly');

      tx.oncomplete = () => {
        if (!isSettled) {
          isSettled = true;
          resolve();
        }
      };

      tx.onerror = () => {
        if (!isSettled) {
          isSettled = true;
          reject(tx.error || new Error('Falha na transação de exportação.'));
        }
      };

      tx.onabort = () => {
        if (!isSettled) {
          isSettled = true;
          reject(new Error('Transação de exportação abortada.'));
        }
      };

      // 3. Consultar individualmente as sete tabelas oficiais
      for (const storeName of REQUIRED_STORES) {
        data[storeName] = [];
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          data[storeName] = req.result || [];
        };
        req.onerror = () => {
          if (!isSettled) {
            isSettled = true;
            reject(req.error || new Error(`Erro ao ler tabela "${storeName}".`));
          }
        };
      }
    });

    const backupPayload: Record<string, unknown> = {
      app: 'TREINO CERTO',
      version: '1.2',
      exportedAt: new Date().toISOString(),
      data,
    };

    // Se a leitura de fit_app_media_db falhar, a exportação deve falhar claramente
    // para nunca entregar um backup aparentemente completo sem as fotografias
    const photosMap = await this.getMediaDB().getAllPhotos();
    if (photosMap && Object.keys(photosMap).length > 0) {
      backupPayload.media = photosMap;
    }

    return JSON.stringify(backupPayload, null, 2);
  }

  // --- Validação Rigorosa de Todas as Tabelas do Backup ---
  public validateBackupString(jsonString: string): BackupValidationResult {
    if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
      return { isValid: false, error: 'O arquivo de backup está vazio.' };
    }

    let payload: unknown;
    try {
      payload = JSON.parse(jsonString);
    } catch (e) {
      return {
        isValid: false,
        error: `Estrutura JSON inválida: ${(e as Error).message}`,
      };
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { isValid: false, error: 'O backup deve ser um objeto JSON bem formado.' };
    }

    const typedPayload = payload as {
      app?: unknown;
      version?: unknown;
      data?: unknown;
      media?: unknown;
    };

    // Validação da Identificação do Aplicativo
    if (typedPayload.app !== 'TREINO CERTO' && typedPayload.app !== 'FIT APP') {
      return {
        isValid: false,
        error: `Identificação do aplicativo inválida: "${String(typedPayload.app || 'indefinida')}". O backup deve pertencer ao TREINO CERTO (ou legado FIT APP).`,
      };
    }

    // Validação da Versão do Backup
    if (
      typedPayload.version === undefined ||
      typedPayload.version === null ||
      String(typedPayload.version).trim() === ''
    ) {
      return { isValid: false, error: 'A versão do backup não foi informada no arquivo.' };
    }

    // Validação do Bloco Principal de Dados
    if (
      !typedPayload.data ||
      typeof typedPayload.data !== 'object' ||
      Array.isArray(typedPayload.data)
    ) {
      return {
        isValid: false,
        error: 'O arquivo não contém o bloco de dados estruturado ("data") ou seu formato é inválido.',
      };
    }

    const dataObj = typedPayload.data as Record<string, unknown>;

    // 1. O backup deve conter OBRIGATORIAMENTE todas as 7 tabelas oficiais
    for (const requiredStore of REQUIRED_STORES) {
      if (!(requiredStore in dataObj)) {
        return {
          isValid: false,
          error: `Tabela obrigatória ausente no backup: "${requiredStore}". Todas as 7 tabelas oficiais devem estar presentes.`,
        };
      }
    }

    // 2. Rejeitar tabelas desconhecidas que não façam parte das oficiais
    for (const key of Object.keys(dataObj)) {
      if (!REQUIRED_STORES.includes(key)) {
        return {
          isValid: false,
          error: `Tabela desconhecida encontrada no backup: "${key}". O arquivo deve conter exclusivamente tabelas oficiais do TREINO CERTO.`,
        };
      }
    }

    const recordCounts: Record<string, number> = {};
    let userNameFound: string | undefined;
    let themeFound: string | undefined;

    // 3. Validação aprofundada de cada tabela e registro
    for (const storeName of REQUIRED_STORES) {
      const records = dataObj[storeName];

      if (!Array.isArray(records)) {
        return {
          isValid: false,
          error: `O conjunto de dados "${storeName}" é inválido: esperado um array, mas recebido ${typeof records}.`,
        };
      }

      recordCounts[storeName] = records.length;
      const seenIds = new Set<string>();

      // Validação individual de cada registro dentro do array
      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        if (!record || typeof record !== 'object' || Array.isArray(record)) {
          return {
            isValid: false,
            error: `Registro #${i + 1} inválido no conjunto "${storeName}": deve ser um objeto estruturado.`,
          };
        }

        const typedRecord = record as { id?: unknown; [key: string]: unknown };

        // Identificador obrigatório
        if (
          typedRecord.id === undefined ||
          typedRecord.id === null ||
          typeof typedRecord.id !== 'string' ||
          typedRecord.id.trim() === ''
        ) {
          return {
            isValid: false,
            error: `Registro #${i + 1} no conjunto "${storeName}" não possui identificador obrigatório ("id") válido.`,
          };
        }

        const recordId = typedRecord.id.trim();

        // Verificação estrita de IDs duplicados dentro da mesma tabela
        if (seenIds.has(recordId)) {
          return {
            isValid: false,
            error: `ID duplicado detectado na tabela "${storeName}": "${recordId}". Cada registro deve ter um identificador único.`,
          };
        }
        seenIds.add(recordId);

        // Validações específicas por tabela
        if (storeName === STORES.PROFILE) {
          if (typedRecord.name !== undefined && typeof typedRecord.name !== 'string') {
            return {
              isValid: false,
              error: `Campo "name" inválido no perfil (esperado texto).`,
            };
          }
          if (
            typedRecord.height !== undefined &&
            typedRecord.height !== null &&
            (typeof typedRecord.height !== 'number' || isNaN(typedRecord.height))
          ) {
            return {
              isValid: false,
              error: `Campo "height" (altura) inválido no perfil (esperado número).`,
            };
          }
          if (
            typedRecord.weight !== undefined &&
            typedRecord.weight !== null &&
            (typeof typedRecord.weight !== 'number' || isNaN(typedRecord.weight))
          ) {
            return {
              isValid: false,
              error: `Campo "weight" (peso) inválido no perfil (esperado número).`,
            };
          }
          if (
            typedRecord.weeklyFrequency !== undefined &&
            typedRecord.weeklyFrequency !== null &&
            (typeof typedRecord.weeklyFrequency !== 'number' || isNaN(typedRecord.weeklyFrequency))
          ) {
            return {
              isValid: false,
              error: `Campo "weeklyFrequency" inválido no perfil (esperado número).`,
            };
          }
          if (
            typedRecord.goal !== undefined &&
            typedRecord.goal !== null &&
            !VALID_GOALS.includes(typedRecord.goal as FitnessGoal)
          ) {
            return {
              isValid: false,
              error: `Objetivo "${String(typedRecord.goal)}" não reconhecido no perfil.`,
            };
          }
          if (typeof typedRecord.name === 'string') {
            userNameFound = typedRecord.name;
          }
        }

        if (storeName === STORES.PREFERENCES) {
          if (typedRecord.theme !== undefined) {
            if (
              typeof typedRecord.theme !== 'string' ||
              !THEMES[typedRecord.theme as ThemeId]
            ) {
              return {
                isValid: false,
                error: `Tema "${String(typedRecord.theme)}" não homologado encontrado no backup. Os temas permitidos são: orange, green, blue, purple, red, gold.`,
              };
            }
            themeFound = typedRecord.theme as string;
          }
        }

        if (storeName === STORES.EQUIPMENTS) {
          if (
            typedRecord.isSelected !== undefined &&
            typedRecord.isSelected !== null &&
            typeof typedRecord.isSelected !== 'boolean'
          ) {
            return {
              isValid: false,
              error: `Campo "isSelected" inválido no equipamento "${recordId}" (esperado valor booleano).`,
            };
          }
          if (
            typedRecord.isCustom !== undefined &&
            typedRecord.isCustom !== null &&
            typeof typedRecord.isCustom !== 'boolean'
          ) {
            return {
              isValid: false,
              error: `Campo "isCustom" inválido no equipamento "${recordId}" (esperado valor booleano).`,
            };
          }
        }
      }
    }

    // 4. Validação estrita do bloco de fotografias ("media"), quando presente
    if (typedPayload.media !== undefined) {
      if (
        typedPayload.media === null ||
        typeof typedPayload.media !== 'object' ||
        Array.isArray(typedPayload.media)
      ) {
        return {
          isValid: false,
          error:
            'O campo "media" do backup possui formato inválido: deve ser um objeto com mapeamento { [equipmentId]: dataUrl }.',
        };
      }

      let totalMediaLength = 0;

      for (const [eqId, photoVal] of Object.entries(
        typedPayload.media as Record<string, unknown>
      )) {
        if (typeof eqId !== 'string' || eqId.trim() === '') {
          return {
            isValid: false,
            error: 'Identificador de equipamento inválido no campo "media" do backup.',
          };
        }

        const photoValidation = validateImageDataUrl(photoVal, eqId);
        if (!photoValidation.isValid) {
          return {
            isValid: false,
            error: photoValidation.error,
          };
        }

        totalMediaLength += (photoVal as string).length;
        if (totalMediaLength > MAX_TOTAL_MEDIA_DATA_URL_LENGTH) {
          return {
            isValid: false,
            error: `O volume total de fotografias no campo "media" excede o limite de segurança permitido (${MAX_TOTAL_MEDIA_DATA_URL_LENGTH} caracteres).`,
          };
        }
      }
    }

    return {
      isValid: true,
      app: typedPayload.app as string,
      version: String(typedPayload.version),
      details: {
        hasProfile: Array.isArray(dataObj.profile) && dataObj.profile.length > 0,
        hasPreferences: Array.isArray(dataObj.preferences) && dataObj.preferences.length > 0,
        theme: themeFound,
        userName: userNameFound,
        recordCounts,
      },
    };
  }

  public _testFaultInjector?: (
    phase: 'before_clear' | 'after_clear' | 'during_insert',
    storeName: string,
    item?: unknown
  ) => boolean;

  public setTestFaultInjector(
    fn?: (
      phase: 'before_clear' | 'after_clear' | 'during_insert',
      storeName: string,
      item?: unknown
    ) => boolean
  ): void {
    this._testFaultInjector = fn;
  }

  /**
   * Coordenação em Duas Fases com Compensação (entre os bancos independentes fit_app_media_db e fit_app_db):
   * 1. Validação integral do backup (incluindo Data URLs e Base64 de "media") antes de alterar qualquer banco.
   * 2. Captura do snapshot das fotografias atuais em fit_app_media_db.
   * 3. Restauração ou limpeza de fit_app_media_db aguardando confirmação formal (tx.oncomplete).
   *    - Caso ocorra erro na gravação de mídia, a transação é abortada via tx.onabort sem alterar fit_app_db.
   * 4. Restauração das 7 tabelas oficiais em fit_app_db em transação readwrite única.
   * 5. Caso a restauração de fit_app_db falhe, executa compensação restaurando as fotografias anteriores em fit_app_media_db.
   * 6. Caso a compensação falhe, retorna erro crítico explícito sem declarar sucesso.
   */
  public async importAllData(
    jsonString: string
  ): Promise<{
    success: boolean;
    message: string;
    details?: BackupValidationResult['details'];
  }> {
    // 1. Validação estrita ANTES de iniciar qualquer transação
    const validation = this.validateBackupString(jsonString);
    if (!validation.isValid) {
      return {
        success: false,
        message: validation.error || 'Arquivo de backup inválido.',
      };
    }

    try {
      const payload = JSON.parse(jsonString) as {
        app: string;
        data: Record<string, unknown[]>;
        media?: Record<string, string>;
      };
      const db = await this.getDB();

      // Confirmação de que todas as 7 tabelas oficiais existem fisicamente no banco
      // Interrompe imediatamente se alguma estiver ausente (sem filtros silenciosos)
      for (const requiredStore of REQUIRED_STORES) {
        if (!db.objectStoreNames.contains(requiredStore)) {
          return {
            success: false,
            message: `Tabela física obrigatória ausente no banco de dados: "${requiredStore}". A restauração não pode prosseguir.`,
          };
        }
      }

      // FASE 1: Snapshot e gravação de fit_app_media_db
      let previousPhotos: Record<string, string> = {};
      try {
        previousPhotos = await this.getMediaDB().getAllPhotos();
      } catch (snapshotErr) {
        return {
          success: false,
          message: `Falha ao registrar snapshot das fotografias existentes em fit_app_media_db: ${
            snapshotErr instanceof Error ? snapshotErr.message : String(snapshotErr)
          }`,
        };
      }

      // Substituição integral ou limpeza de fit_app_media_db
      try {
        if (payload.media && typeof payload.media === 'object') {
          await this.getMediaDB().saveAllPhotos(payload.media);
        } else {
          // Se o backup NÃO contiver o campo "media", limpar todas as fotos de "fit_app_media_db" para não deixar mídias órfãs
          await this.getMediaDB().clearAllPhotos();
        }
      } catch (mediaErr) {
        // Se a restauração de fit_app_media_db falhar, aborta antes de alterar fit_app_db
        return {
          success: false,
          message: `Falha na gravação do banco de mídias fit_app_media_db. Restauração cancelada antes de modificar fit_app_db: ${
            mediaErr instanceof Error ? mediaErr.message : String(mediaErr)
          }`,
        };
      }

      // FASE 2: Transação atômica única readwrite abrangendo todas as 7 tabelas oficiais em fit_app_db
      const targetStoreNames = Array.from(REQUIRED_STORES);

      try {
        await new Promise<void>((resolve, reject) => {
          let isSettled = false;
          let originalCause: Error | null = null;
          let abortRequested = false;
          const tx = db.transaction(targetStoreNames, 'readwrite');

          const requestAbort = (cause: Error) => {
            if (!originalCause) {
              originalCause = cause;
            }
            if (!abortRequested) {
              abortRequested = true;
              try {
                tx.abort();
              } catch {
                // Transação pode já estar finalizada ou inativa
              }
            }
          };

          tx.oncomplete = () => {
            if (!isSettled) {
              isSettled = true;
              resolve();
            }
          };

          tx.onerror = (event) => {
            if (event && typeof event.preventDefault === 'function') {
              event.preventDefault();
            }
            const err = tx.error || originalCause || new Error('Erro na transação de restauração.');
            requestAbort(err);
          };

          // Confirmação formal do rollback: a Promise SOMENTE rejeita após tx.onabort
          tx.onabort = () => {
            if (!isSettled) {
              isSettled = true;
              const message = originalCause
                ? originalCause.message
                : 'A transação de restauração foi abortada. Todos os dados anteriores foram preservados intactos.';
              reject(new Error(message));
            }
          };

          try {
            // Fase 2.1: Limpeza de todas as tabelas dentro da transação atômica
            for (const storeName of targetStoreNames) {
              const store = tx.objectStore(storeName);
              const clearReq = store.clear();
              clearReq.onerror = () => {
                requestAbort(clearReq.error || new Error(`Erro ao limpar a tabela "${storeName}".`));
              };
            }

            // Fase 2.2: Inserção de todos os novos registros
            for (const storeName of targetStoreNames) {
              const store = tx.objectStore(storeName);
              const records = payload.data[storeName] || [];

              for (const item of records) {
                // Verificação do mecanismo de injeção de falha exclusivo para testes de rollback
                if (
                  this._testFaultInjector &&
                  this._testFaultInjector('during_insert', storeName, item)
                ) {
                  const faultErr = new Error(
                    `Falha intencional induzida para teste real de rollback após limpeza da tabela "${storeName}".`
                  );
                  requestAbort(faultErr);
                  return; // Interrompe o processamento e aguarda formalmente o evento tx.onabort
                }

                const putReq = store.put(item);
                putReq.onerror = () => {
                  requestAbort(putReq.error || new Error(`Erro ao inserir registro na tabela "${storeName}".`));
                };
              }
            }
          } catch (err) {
            const caughtErr = err instanceof Error ? err : new Error(String(err));
            requestAbort(caughtErr);
          }
        });
      } catch (dbErr) {
        // Se a restauração de fit_app_db falhar após a gravação das mídias:
        // Compensar o estado de fit_app_media_db restaurando o snapshot das fotografias anteriores
        try {
          await this.getMediaDB().saveAllPhotos(previousPhotos);
          return {
            success: false,
            message: `Falha na restauração do banco principal fit_app_db. Compensação executada com sucesso: fotografias anteriores restauradas em fit_app_media_db. Causa: ${
              dbErr instanceof Error ? dbErr.message : String(dbErr)
            }`,
          };
        } catch (compErr) {
          // Se a compensação falhar, retornar mensagem explícita relatando a situação crítica sem declarar sucesso
          return {
            success: false,
            message: `FALHA CRÍTICA NA COMPENSAÇÃO: a restauração de fit_app_db falhou (${
              dbErr instanceof Error ? dbErr.message : String(dbErr)
            }) e a rotina de compensação de fotografias em fit_app_media_db também falhou (${
              compErr instanceof Error ? compErr.message : String(compErr)
            }).`,
          };
        }
      }

      // 3. Somente após a confirmação total, sincroniza cache secundário
      if (Array.isArray(payload.data.profile) && payload.data.profile.length > 0) {
        const profileList = payload.data.profile as Array<{ id: string }>;
        const prof =
          profileList.find((p) => p.id === 'current_user') ||
          profileList[0];
        safeLocalStorageSet('treino_certo_profile', JSON.stringify(prof));
      }
      if (Array.isArray(payload.data.preferences) && payload.data.preferences.length > 0) {
        const preferencesList = payload.data.preferences as Array<{ id: string }>;
        const prefs =
          preferencesList.find((p) => p.id === 'current_preferences') ||
          preferencesList[0];
        safeLocalStorageSet('treino_certo_preferences', JSON.stringify(prefs));
      }

      const legacyNotice =
        validation.app === 'FIT APP' ? ' (Migrado com sucesso do backup legado FIT APP)' : '';

      return {
        success: true,
        message: `Restauração coordenada concluída com sucesso! Todas as tabelas e mídias foram sincronizadas.${legacyNotice}`,
        details: validation.details,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na restauração do backup.';
      return { success: false, message: msg };
    }
  }

  // --- Métodos de Mídia / Fotos de Equipamentos ---
  public async getEquipmentPhoto(equipmentId: string): Promise<string | null> {
    return this.getMediaDB().getPhoto(equipmentId);
  }

  public async saveEquipmentPhoto(equipmentId: string, dataUrl: string): Promise<void> {
    return this.getMediaDB().savePhoto(equipmentId, dataUrl);
  }

  public async deleteEquipmentPhoto(equipmentId: string): Promise<void> {
    return this.getMediaDB().deletePhoto(equipmentId);
  }

  public async getAllEquipmentPhotos(): Promise<Record<string, string>> {
    return this.getMediaDB().getAllPhotos();
  }

  /**
   * Utilitário para reset completo em ambiente de testes ou auditoria
   */
  public async clearAllStores(): Promise<void> {
    const db = await this.getDB();
    const storeNames = Array.from(db.objectStoreNames);
    if (storeNames.length === 0) return;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeNames, 'readwrite');
      for (const name of storeNames) {
        tx.objectStore(name).clear();
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Consulta consistente de todos os registros de todas as 7 tabelas oficiais.
   */
  public async getAllRecordsFromStores(): Promise<Record<string, unknown[]>> {
    const db = await this.getDB();
    const result: Record<string, unknown[]> = {};

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(REQUIRED_STORES, 'readonly');
      for (const storeName of REQUIRED_STORES) {
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => {
          result[storeName] = req.result || [];
        };
        req.onerror = () => reject(req.error);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return result;
  }
}

export const dbService = new FitAppDB();
