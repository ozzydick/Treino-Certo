/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DEFAULT_EXERCISES_CATALOG } from '../constants/exercisesCatalog';
import { dbService, safeLocalStorageGet, safeLocalStorageSet } from '../services/db';
import {
  WorkoutDivision,
  WorkoutPlanItem,
  WorkoutSessionExerciseLog,
  WorkoutSessionItem,
} from '../types';
import { WorkoutSessionCoordinator } from '../services/workoutSessionCoordinator';
import { playTimerCompletionChime } from '../utils/audioFeedback';
import {
  addSecondsToRestDeadline,
  calculateRemainingSeconds,
  shouldTriggerRestAlert,
} from '../utils/restTimerHelper';
import { useUser } from './UserContext';

const REST_TIMER_STORAGE_KEY = 'treino_certo_rest_timer';

export interface WorkoutContextType {
  workoutPlans: WorkoutPlanItem[];
  activePlan: WorkoutPlanItem | null;
  activeSession: WorkoutSessionItem | null;
  sessionsHistory: WorkoutSessionItem[];
  isLoading: boolean;
  isSavingSession: boolean;
  persistenceError: string | null;
  clearPersistenceError: () => void;
  refreshPlans: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  savePlan: (plan: WorkoutPlanItem) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  setActivePlanId: (id: string) => Promise<void>;
  startSession: (planId: string, divisionId: string) => Promise<WorkoutSessionItem>;
  updateActiveSession: (updater: (prev: WorkoutSessionItem) => WorkoutSessionItem) => Promise<WorkoutSessionItem>;
  pauseActiveSession: () => Promise<WorkoutSessionItem>;
  resumeActiveSession: () => Promise<WorkoutSessionItem>;
  finishActiveSession: (notes?: string) => Promise<WorkoutSessionItem>;
  discardActiveSession: () => Promise<void>;
  deleteSessionHistory: (id: string) => Promise<void>;
  // Rest Timer
  restTimerSeconds: number;
  restTimerTotal: number;
  restTimerEndAt: number | null;
  isRestTimerActive: boolean;
  startRestTimer: (seconds: number) => void;
  stopRestTimer: () => void;
  addRestTimerSeconds: (deltaSeconds: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = useUser();
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlanItem[]>([]);
  const [activePlan, setActivePlan] = useState<WorkoutPlanItem | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSessionItem | null>(null);
  const [sessionsHistory, setSessionsHistory] = useState<WorkoutSessionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingSession, setIsSavingSession] = useState<boolean>(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  // Coordenador central de persistência e concorrência de sessão
  const coordinatorRef = useRef<WorkoutSessionCoordinator>(
    new WorkoutSessionCoordinator(dbService)
  );

  // Rest Timer State
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(0);
  const [restTimerTotal, setRestTimerTotal] = useState<number>(60);
  const [restTimerEndAt, setRestTimerEndAt] = useState<number | null>(null);
  const [isRestTimerActive, setIsRestTimerActive] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);
  const restTimerEndAtRef = useRef<number | null>(null);
  const hasAlertedRef = useRef<boolean>(false);

  // Wake lock ref
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Configura listeners do coordenador
  useEffect(() => {
    coordinatorRef.current.setListener({
      onSessionChange: (session) => setActiveSession(session),
      onErrorChange: (err) => setPersistenceError(err),
      onSavingChange: (saving) => setIsSavingSession(saving),
    });
  }, []);

  const clearPersistenceError = useCallback(() => {
    coordinatorRef.current.clearError();
    setPersistenceError(null);
  }, []);

  // Carrega planos e sessões ao inicializar
  const refreshPlans = useCallback(async () => {
    try {
      const plans = await dbService.getWorkoutPlans();
      setWorkoutPlans(plans);
      const active = plans.find((p) => p.isActive) || plans[0] || null;
      setActivePlan(active);
    } catch (e) {
      console.error('Falha ao carregar fichas de treino:', e);
    }
  }, []);

  const refreshSessions = useCallback(async () => {
    try {
      const sessions = await dbService.getWorkoutSessions();
      setSessionsHistory(sessions.filter((s) => s.isCompleted));
      const ongoing = sessions.find((s) => !s.isCompleted) || null;
      coordinatorRef.current.setActiveSession(ongoing);
      setActiveSession(ongoing);
    } catch (e) {
      console.error('Falha ao carregar sessões de treino:', e);
    }
  }, []);

  // Restaura timer de descanso ao iniciar
  const restoreRestTimerFromStorage = useCallback(() => {
    try {
      const savedTimerJson = safeLocalStorageGet(REST_TIMER_STORAGE_KEY);
      if (savedTimerJson) {
        const parsed = JSON.parse(savedTimerJson);
        if (parsed && typeof parsed.restTimerEndAt === 'number') {
          const remaining = Math.ceil((parsed.restTimerEndAt - Date.now()) / 1000);
          if (remaining > 0) {
            restTimerEndAtRef.current = parsed.restTimerEndAt;
            hasAlertedRef.current = false;
            setRestTimerEndAt(parsed.restTimerEndAt);
            setRestTimerTotal(parsed.restTimerTotal || remaining);
            setRestTimerSeconds(remaining);
            setIsRestTimerActive(true);

            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
            }

            timerIntervalRef.current = window.setInterval(() => {
              const targetEnd = restTimerEndAtRef.current;
              if (!targetEnd) {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                setIsRestTimerActive(false);
                return;
              }
              const rem = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
              setRestTimerSeconds(rem);
              if (rem <= 0) {
                if (!hasAlertedRef.current) {
                  hasAlertedRef.current = true;
                  playTimerCompletionChime(preferences.soundAlerts, preferences.vibration);
                }
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                  timerIntervalRef.current = null;
                }
                restTimerEndAtRef.current = null;
                setIsRestTimerActive(false);
                setRestTimerEndAt(null);
                setRestTimerSeconds(0);
                try {
                  if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(REST_TIMER_STORAGE_KEY);
                  }
                } catch {
                  // ignore
                }
              }
            }, 250);
          } else {
            // Expirou enquanto o app estava fechado
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(REST_TIMER_STORAGE_KEY);
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch (e) {
      console.warn('[RestTimer] Falha não crítica ao restaurar timer:', e);
    }
  }, [preferences.soundAlerts, preferences.vibration]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      setIsLoading(true);
      await Promise.all([refreshPlans(), refreshSessions()]);
      if (mounted) {
        restoreRestTimerFromStorage();
        setIsLoading(false);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, [refreshPlans, refreshSessions, restoreRestTimerFromStorage]);

  // Gestão de WakeLock durante sessão de treino ativa
  useEffect(() => {
    if (activeSession && !activeSession.isCompleted && preferences.keepScreenAwake) {
      if ('wakeLock' in navigator && !wakeLockRef.current) {
        navigator.wakeLock
          .request('screen')
          .then((lock) => {
            wakeLockRef.current = lock;
            lock.addEventListener('release', () => {
              wakeLockRef.current = null;
            });
          })
          .catch(() => {});
      }
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
        wakeLockRef.current = null;
      }
    };
  }, [activeSession, preferences.keepScreenAwake]);

  // Rest Timer logic
  const stopRestTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    restTimerEndAtRef.current = null;
    setIsRestTimerActive(false);
    setRestTimerEndAt(null);
    setRestTimerSeconds(0);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(REST_TIMER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const startRestTimer = useCallback(
    (seconds: number) => {
      stopRestTimer();
      const sec = Math.max(5, seconds || preferences.restTimerDefaultSeconds || 60);
      const endAt = Date.now() + sec * 1000;
      hasAlertedRef.current = false;
      restTimerEndAtRef.current = endAt;

      setRestTimerTotal(sec);
      setRestTimerEndAt(endAt);
      setRestTimerSeconds(sec);
      setIsRestTimerActive(true);

      safeLocalStorageSet(
        REST_TIMER_STORAGE_KEY,
        JSON.stringify({ restTimerEndAt: endAt, restTimerTotal: sec })
      );

      timerIntervalRef.current = window.setInterval(() => {
        const targetEnd = restTimerEndAtRef.current;
        if (!targetEnd) {
          stopRestTimer();
          return;
        }
        const remaining = Math.max(0, Math.ceil((targetEnd - Date.now()) / 1000));
        setRestTimerSeconds(remaining);

        if (remaining <= 0) {
          if (!hasAlertedRef.current) {
            hasAlertedRef.current = true;
            playTimerCompletionChime(preferences.soundAlerts, preferences.vibration);
          }
          stopRestTimer();
        }
      }, 250);
    },
    [preferences.restTimerDefaultSeconds, preferences.soundAlerts, preferences.vibration, stopRestTimer]
  );

  const addRestTimerSeconds = useCallback(
    (deltaSeconds: number) => {
      const currentEnd = restTimerEndAtRef.current;
      if (!currentEnd) return;

      const newEnd = currentEnd + deltaSeconds * 1000;
      const remaining = Math.ceil((newEnd - Date.now()) / 1000);

      if (remaining <= 0) {
        stopRestTimer();
        return;
      }

      restTimerEndAtRef.current = newEnd;
      const newTotal = Math.max(10, restTimerTotal + deltaSeconds);

      setRestTimerEndAt(newEnd);
      setRestTimerSeconds(remaining);
      setRestTimerTotal(newTotal);

      safeLocalStorageSet(
        REST_TIMER_STORAGE_KEY,
        JSON.stringify({ restTimerEndAt: newEnd, restTimerTotal: newTotal })
      );
    },
    [restTimerTotal, stopRestTimer]
  );

  // CRUD de Planos
  const savePlan = useCallback(
    async (plan: WorkoutPlanItem) => {
      await dbService.saveWorkoutPlan(plan);
      await refreshPlans();
    },
    [refreshPlans]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      await dbService.deleteWorkoutPlan(id);
      await refreshPlans();
    },
    [refreshPlans]
  );

  const setActivePlanId = useCallback(
    async (id: string) => {
      await dbService.setActiveWorkoutPlan(id);
      await refreshPlans();
    },
    [refreshPlans]
  );

  // Início de Sessão de Treino
  const startSession = useCallback(
    async (planId: string, divisionId: string): Promise<WorkoutSessionItem> => {
      const plan =
        workoutPlans.find((p) => p.id === planId) || (await dbService.getWorkoutPlan(planId));
      if (!plan) throw new Error('Ficha de treino não encontrada.');

      const division = plan.divisions.find((d: WorkoutDivision) => d.id === divisionId);
      if (!division) throw new Error('Divisão de treino não encontrada.');

      const nowIso = new Date().toISOString();

      // Monta logs iniciais para cada exercício da divisão com suas séries prescritas
      const cachedCustom = safeLocalStorageGet('treino_certo_custom_exercises');
      let customExList: any[] = [];
      if (cachedCustom) {
        try {
          const parsed = JSON.parse(cachedCustom);
          if (Array.isArray(parsed)) customExList = parsed;
        } catch {
          // ignore
        }
      }
      const fullCatalog = [...DEFAULT_EXERCISES_CATALOG, ...customExList];

      const exerciseLogs: WorkoutSessionExerciseLog[] = division.exercises.map((ex) => {
        const catalogEntry = fullCatalog.find((c) => c.id === ex.exerciseId);
        const name = catalogEntry ? catalogEntry.name : ex.exerciseId;
        const setsCount = Math.max(1, ex.prescribedSets || 3);
        const sets = Array.from({ length: setsCount }, (_, i) => ({
          setNumber: i + 1,
          prescribedReps: ex.prescribedReps || '10-12',
          prescribedWeightKg: ex.prescribedWeightKg,
          actualReps: parseInt(ex.prescribedReps.split('-')[0], 10) || 10,
          actualWeightKg: ex.prescribedWeightKg || 0,
          completed: false,
        }));

        return {
          exerciseId: ex.exerciseId,
          exerciseName: name,
          order: ex.order,
          skipped: false,
          notes: ex.instructorNotes,
          sets,
        };
      });

      const newSession: WorkoutSessionItem = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        workoutPlanId: plan.id,
        planName: plan.name,
        divisionId: division.id,
        divisionName: division.name,
        startTime: nowIso,
        lastResumedAt: nowIso,
        isPaused: false,
        elapsedActiveSeconds: 0,
        pausedTotalSeconds: 0,
        isCompleted: false,
        exercisesCompleted: 0,
        totalVolumeKg: 0,
        exerciseLogs,
      };

      await dbService.saveWorkoutSession(newSession);
      coordinatorRef.current.setActiveSession(newSession);
      setActiveSession(newSession);
      setPersistenceError(null);
      return newSession;
    },
    [workoutPlans]
  );

  /**
   * Atualização com persistência serializada, aguardada e atômica.
   * Delegada ao WorkoutSessionCoordinator (rejeita novas entradas se finalizando/descartando).
   */
  const updateActiveSession = useCallback(
    (updater: (prev: WorkoutSessionItem) => WorkoutSessionItem): Promise<WorkoutSessionItem> => {
      return coordinatorRef.current.enqueueUpdate(updater);
    },
    []
  );

  // Pausa a sessão com registro confiável do tempo decorrido até o instante da pausa
  const pauseActiveSession = useCallback(async (): Promise<WorkoutSessionItem> => {
    return updateActiveSession((prev) => {
      if (prev.isPaused) return prev;
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const resumedMs = prev.lastResumedAt
        ? new Date(prev.lastResumedAt).getTime()
        : new Date(prev.startTime).getTime();
      const deltaActiveSec = Math.max(0, Math.floor((nowMs - resumedMs) / 1000));
      const newActiveTotal = Math.max(0, (prev.elapsedActiveSeconds || 0) + deltaActiveSec);

      return {
        ...prev,
        isPaused: true,
        pausedAt: nowIso,
        elapsedActiveSeconds: newActiveTotal,
        durationSeconds: newActiveTotal,
      };
    });
  }, [updateActiveSession]);

  // Retoma a sessão sem contabilizar o tempo transcorrido durante a pausa
  const resumeActiveSession = useCallback(async (): Promise<WorkoutSessionItem> => {
    return updateActiveSession((prev) => {
      if (!prev.isPaused) return prev;
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const pausedMs = prev.pausedAt ? new Date(prev.pausedAt).getTime() : nowMs;
      const deltaPausedSec = Math.max(0, Math.floor((nowMs - pausedMs) / 1000));

      return {
        ...prev,
        isPaused: false,
        pausedAt: undefined,
        lastResumedAt: nowIso,
        pausedTotalSeconds: (prev.pausedTotalSeconds || 0) + deltaPausedSec,
      };
    });
  }, [updateActiveSession]);

  // Finalização definitiva serializada pelo WorkoutSessionCoordinator
  const finishActiveSession = useCallback(
    async (notes?: string): Promise<WorkoutSessionItem> => {
      stopRestTimer();
      const completed = await coordinatorRef.current.enqueueFinish({ notes });
      await refreshSessions();
      return completed;
    },
    [refreshSessions, stopRestTimer]
  );

  // Descarte serializado pelo WorkoutSessionCoordinator
  const discardActiveSession = useCallback(async (): Promise<void> => {
    stopRestTimer();
    await coordinatorRef.current.enqueueDiscard();
    await refreshSessions();
  }, [refreshSessions, stopRestTimer]);

  const deleteSessionHistory = useCallback(
    async (id: string) => {
      await dbService.deleteWorkoutSession(id);
      await refreshSessions();
    },
    [refreshSessions]
  );

  return (
    <WorkoutContext.Provider
      value={{
        workoutPlans,
        activePlan,
        activeSession,
        sessionsHistory,
        isLoading,
        isSavingSession,
        persistenceError,
        clearPersistenceError,
        refreshPlans,
        refreshSessions,
        savePlan,
        deletePlan,
        setActivePlanId,
        startSession,
        updateActiveSession,
        pauseActiveSession,
        resumeActiveSession,
        finishActiveSession,
        discardActiveSession,
        deleteSessionHistory,
        restTimerSeconds,
        restTimerTotal,
        restTimerEndAt,
        isRestTimerActive,
        startRestTimer,
        stopRestTimer,
        addRestTimerSeconds,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout(): WorkoutContextType {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout deve ser usado dentro de um WorkoutProvider');
  }
  return context;
}
