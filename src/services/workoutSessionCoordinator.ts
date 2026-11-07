/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkoutSessionItem } from '../types';

export interface IDatabaseSessionStorage {
  saveWorkoutSession(session: WorkoutSessionItem): Promise<void>;
  deleteWorkoutSession(id: string): Promise<void>;
}

export interface CoordinatorListener {
  onSessionChange?: (session: WorkoutSessionItem | null) => void;
  onErrorChange?: (error: string | null) => void;
  onSavingChange?: (isSaving: boolean) => void;
}

/**
 * Coordenador central de concorrência, serialização e persistência de sessões de treino.
 * Garante:
 * 1. Serialização estrita via Promise chain (saveQueue).
 * 2. Atualizações aceitas antes de uma finalização ou descarte são concluídas na ordem original.
 * 3. Novas atualizações requisitadas após o início de finalização ou descarte são rejeitadas de imediato.
 * 4. Desduplicação de chamadas simultâneas de finalização e descarte.
 * 5. Se uma gravação prévia falhar, não realiza descarte ou finalização silenciosos.
 * 6. Preservação da sessão ativa em caso de falha de exclusão ou de gravação final.
 */
export class WorkoutSessionCoordinator {
  private storage: IDatabaseSessionStorage;
  private saveQueue: Promise<unknown> = Promise.resolve();
  private activeSession: WorkoutSessionItem | null = null;
  private isFinishingFlag = false;
  private isDiscardingFlag = false;
  private finishingPromise: Promise<WorkoutSessionItem> | null = null;
  private discardingPromise: Promise<void> | null = null;
  private lastQueueError: Error | null = null;
  private listeners: CoordinatorListener = {};

  constructor(storage: IDatabaseSessionStorage, initialSession: WorkoutSessionItem | null = null) {
    this.storage = storage;
    this.activeSession = initialSession;
  }

  public setListener(listener: CoordinatorListener): void {
    this.listeners = listener;
  }

  public getActiveSession(): WorkoutSessionItem | null {
    return this.activeSession;
  }

  public setActiveSession(session: WorkoutSessionItem | null): void {
    this.activeSession = session;
    this.listeners.onSessionChange?.(session);
  }

  public isFinishing(): boolean {
    return this.isFinishingFlag;
  }

  public isDiscarding(): boolean {
    return this.isDiscardingFlag;
  }

  public getLastError(): Error | null {
    return this.lastQueueError;
  }

  public clearError(): void {
    this.lastQueueError = null;
    this.listeners.onErrorChange?.(null);
  }

  public reset(): void {
    this.saveQueue = Promise.resolve();
    this.activeSession = null;
    this.isFinishingFlag = false;
    this.isDiscardingFlag = false;
    this.finishingPromise = null;
    this.discardingPromise = null;
    this.lastQueueError = null;
    this.listeners.onSessionChange?.(null);
    this.listeners.onErrorChange?.(null);
    this.listeners.onSavingChange?.(false);
  }

  /**
   * Enfileira uma atualização de sessão.
   * Regra Fundamental:
   * - Se solicitada DEPOIS que a finalização ou descarte foram iniciados, rejeita de imediato.
   * - Se aceita antes, é adicionada à fila e executa normalmente.
   */
  public enqueueUpdate(
    updater: (prev: WorkoutSessionItem) => WorkoutSessionItem
  ): Promise<WorkoutSessionItem> {
    // 1. Bloqueia novas atualizações se finalização ou descarte já estiverem em andamento
    if (this.isFinishingFlag) {
      return Promise.reject(
        new Error('Não é possível atualizar séries: a finalização da sessão já foi iniciada.')
      );
    }
    if (this.isDiscardingFlag) {
      return Promise.reject(
        new Error('Não é possível atualizar séries: a sessão está em processo de descarte.')
      );
    }

    const task = async (): Promise<WorkoutSessionItem> => {
      // Falha anterior na fila não pode ser ignorada
      if (this.lastQueueError) {
        throw new Error(
          `Operação abortada devido a falha anterior de persistência: ${this.lastQueueError.message}`
        );
      }

      const current = this.activeSession;
      if (!current) {
        throw new Error('Não há sessão de treino ativa para atualizar.');
      }

      // Cálculo previsível do estado atualizado
      const updated = updater(current);

      // Recalcula exercícios completos e volume total em kg
      let completedCount = 0;
      let totalVol = 0;

      if (updated.exerciseLogs) {
        for (const exLog of updated.exerciseLogs) {
          if (exLog.skipped) continue;
          const completedSets = exLog.sets.filter((s) => s.completed);
          if (completedSets.length > 0) {
            completedCount++;
          }
          for (const s of completedSets) {
            const reps = Number(s.actualReps) || 0;
            const weight = Number(s.actualWeightKg) || 0;
            if (reps > 0 && weight > 0) {
              totalVol += reps * weight;
            }
          }
        }
      }

      const sessionToPersist: WorkoutSessionItem = {
        ...updated,
        exercisesCompleted: completedCount,
        totalVolumeKg: Math.round(totalVol * 10) / 10,
      };

      this.listeners.onSavingChange?.(true);
      try {
        await this.storage.saveWorkoutSession(sessionToPersist);
        this.activeSession = sessionToPersist;
        this.lastQueueError = null;
        this.listeners.onSessionChange?.(sessionToPersist);
        this.listeners.onErrorChange?.(null);
        return sessionToPersist;
      } catch (err: unknown) {
        const caughtErr = err instanceof Error ? err : new Error(String(err));
        this.lastQueueError = caughtErr;
        this.listeners.onErrorChange?.(caughtErr.message);
        throw caughtErr;
      } finally {
        this.listeners.onSavingChange?.(false);
      }
    };

    const nextPromise = this.saveQueue.then(task, () => task());
    this.saveQueue = nextPromise.catch(() => {});
    return nextPromise;
  }

  /**
   * Finalização serializada.
   * Aguarda todas as atualizações prévias na fila.
   * Desduplica chamadas simultâneas.
   * Não descarta ou finaliza silenciosamente se houver falha prévia.
   * Preserva a sessão ativa se a gravação final falhar.
   */
  public enqueueFinish(options?: {
    notes?: string;
    onBeforeSave?: (session: WorkoutSessionItem) => void;
  }): Promise<WorkoutSessionItem> {
    if (this.finishingPromise) {
      return this.finishingPromise;
    }

    if (this.isDiscardingFlag) {
      return Promise.reject(
        new Error('Não é possível finalizar uma sessão em processo de descarte.')
      );
    }

    if (!this.activeSession) {
      return Promise.reject(
        new Error('Não há sessão de treino em andamento para finalizar.')
      );
    }

    this.isFinishingFlag = true;

    const finishTask = async (): Promise<WorkoutSessionItem> => {
      // 1. Falha anterior não pode ser ignorada
      if (this.lastQueueError) {
        this.isFinishingFlag = false;
        this.finishingPromise = null;
        throw new Error(
          `Não é possível finalizar a sessão devido a falha anterior de persistência: ${this.lastQueueError.message}`
        );
      }

      const sessionToFinish = this.activeSession;
      if (!sessionToFinish) {
        this.isFinishingFlag = false;
        this.finishingPromise = null;
        throw new Error('Não há sessão de treino ativa para finalizar.');
      }

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();

      let finalActiveSeconds = Math.max(0, sessionToFinish.elapsedActiveSeconds || 0);
      if (!sessionToFinish.isPaused) {
        const resumedMs = sessionToFinish.lastResumedAt
          ? new Date(sessionToFinish.lastResumedAt).getTime()
          : new Date(sessionToFinish.startTime).getTime();
        finalActiveSeconds += Math.max(0, Math.floor((nowMs - resumedMs) / 1000));
      }
      finalActiveSeconds = Math.max(1, finalActiveSeconds);

      let completedCount = 0;
      let totalVol = 0;

      if (sessionToFinish.exerciseLogs) {
        for (const exLog of sessionToFinish.exerciseLogs) {
          if (exLog.skipped) continue;
          const completedSets = exLog.sets.filter((s) => s.completed);
          if (completedSets.length > 0) completedCount++;
          for (const s of completedSets) {
            const reps = Number(s.actualReps) || 0;
            const weight = Number(s.actualWeightKg) || 0;
            if (reps > 0 && weight > 0) {
              totalVol += reps * weight;
            }
          }
        }
      }

      const completedSession: WorkoutSessionItem = {
        ...sessionToFinish,
        endTime: nowIso,
        durationSeconds: finalActiveSeconds,
        elapsedActiveSeconds: finalActiveSeconds,
        isPaused: false,
        pausedAt: undefined,
        isCompleted: true,
        exercisesCompleted: completedCount,
        totalVolumeKg: Math.round(totalVol * 10) / 10,
        notes: options?.notes !== undefined ? options.notes : sessionToFinish.notes,
      };

      options?.onBeforeSave?.(completedSession);

      this.listeners.onSavingChange?.(true);
      try {
        await this.storage.saveWorkoutSession(completedSession);

        // A sessão somente é removida após a confirmação formal da gravação
        this.activeSession = null;
        this.lastQueueError = null;
        this.isFinishingFlag = false;
        this.finishingPromise = null;
        this.listeners.onSessionChange?.(null);
        this.listeners.onErrorChange?.(null);
        return completedSession;
      } catch (err: unknown) {
        const caughtErr = err instanceof Error ? err : new Error(String(err));
        // Preserva a sessão ativa para recuperação pelo usuário
        this.isFinishingFlag = false;
        this.finishingPromise = null;
        this.listeners.onErrorChange?.(caughtErr.message);
        throw caughtErr;
      } finally {
        this.listeners.onSavingChange?.(false);
      }
    };

    const finishPromise = this.saveQueue.then(finishTask, () => finishTask());
    this.finishingPromise = finishPromise;
    this.saveQueue = finishPromise.catch(() => {});
    return finishPromise;
  }

  /**
   * Descarte serializado.
   * 1. Bloqueia imediatamente novas atualizações de séries.
   * 2. Atualizações aceitas antes são concluídas normalmente na fila.
   * 3. A exclusão no IndexedDB ocorre estritamente depois das operações anteriores.
   * 4. Deduplica chamadas simultâneas de descarte.
   * 5. Se uma gravação anterior falhar, interrompe e não descarta silenciosamente.
   * 6. Em caso de falha na exclusão, preserva a sessão recuperável.
   */
  public enqueueDiscard(options?: {
    onBeforeDelete?: (sessionId: string) => void;
  }): Promise<void> {
    if (this.discardingPromise) {
      return this.discardingPromise;
    }

    if (this.isFinishingFlag) {
      return Promise.reject(new Error('A sessão já está em processo de finalização.'));
    }

    if (!this.activeSession) {
      return Promise.resolve();
    }

    // Bloqueia imediatamente novas chamadas
    this.isDiscardingFlag = true;
    const targetSession = this.activeSession;

    const discardTask = async (): Promise<void> => {
      // Falha anterior de persistência impede descarte silencioso
      if (this.lastQueueError) {
        this.isDiscardingFlag = false;
        this.discardingPromise = null;
        throw new Error(
          `Não é possível descartar a sessão devido a falha anterior de persistência: ${this.lastQueueError.message}`
        );
      }

      const targetId = this.activeSession?.id || targetSession.id;
      options?.onBeforeDelete?.(targetId);

      this.listeners.onSavingChange?.(true);
      try {
        await this.storage.deleteWorkoutSession(targetId);

        // Limpeza dos estados somente após a confirmação da exclusão
        this.activeSession = null;
        this.lastQueueError = null;
        this.isDiscardingFlag = false;
        this.discardingPromise = null;
        this.listeners.onSessionChange?.(null);
        this.listeners.onErrorChange?.(null);
      } catch (err: unknown) {
        const caughtErr = err instanceof Error ? err : new Error(String(err));
        // Falha na exclusão mantém a sessão recuperável
        this.isDiscardingFlag = false;
        this.discardingPromise = null;
        this.listeners.onErrorChange?.(caughtErr.message);
        throw caughtErr;
      } finally {
        this.listeners.onSavingChange?.(false);
      }
    };

    const discardPromise = this.saveQueue.then(discardTask, () => discardTask());
    this.discardingPromise = discardPromise;
    this.saveQueue = discardPromise.catch(() => {});
    return discardPromise;
  }
}
