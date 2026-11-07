/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Utilitários puros para cálculo temporal, formatação e verificação de alertas do Timer de Descanso.
 */

export function calculateRemainingSeconds(endAt: number | null, nowMs: number): number {
  if (!endAt) return 0;
  return Math.max(0, Math.ceil((endAt - nowMs) / 1000));
}

export function addSecondsToRestDeadline(
  currentEndAt: number | null,
  currentTotal: number,
  deltaSeconds: number,
  nowMs: number
): { newEndAt: number | null; newTotal: number; remaining: number } {
  const baseEnd = currentEndAt && currentEndAt > nowMs ? currentEndAt : nowMs;
  const newEnd = baseEnd + deltaSeconds * 1000;
  const remaining = Math.max(0, Math.ceil((newEnd - nowMs) / 1000));

  if (remaining <= 0) {
    return { newEndAt: null, newTotal: 0, remaining: 0 };
  }

  const newTotal = Math.max(10, currentTotal + deltaSeconds);
  return { newEndAt: newEnd, newTotal, remaining };
}

export function formatRestTimerDisplay(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const minutes = Math.floor(clamped / 60);
  const remSec = clamped % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remSec).padStart(2, '0')}`;
}

export function shouldTriggerRestAlert(remainingSeconds: number, hasAlerted: boolean): boolean {
  return remainingSeconds <= 0 && !hasAlerted;
}
