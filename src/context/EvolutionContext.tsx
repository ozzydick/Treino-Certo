/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { dbService } from '../services/db';
import { BodyMeasurementItem, EvolutionTimeRange } from '../types';
import {
  calculateOverallEvolutionMetrics,
  calculatePersonalRecords,
  exportEvolutionReportCsv,
  exportEvolutionReportJson,
  OverallEvolutionMetrics,
  PersonalRecordItem,
} from '../utils/evolutionCalculator';
import { useWorkout } from './WorkoutContext';

export interface EvolutionContextType {
  measurements: BodyMeasurementItem[];
  isLoadingMeasurements: boolean;
  selectedTimeRange: EvolutionTimeRange;
  setSelectedTimeRange: (range: EvolutionTimeRange) => void;
  refreshMeasurements: () => Promise<void>;
  ensureMeasurementsLoaded: () => Promise<void>;
  saveMeasurement: (item: BodyMeasurementItem) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  overallMetrics: OverallEvolutionMetrics;
  personalRecords: PersonalRecordItem[];
  exportJson: () => string;
  exportCsv: () => string;
}

const EvolutionContext = createContext<EvolutionContextType | undefined>(undefined);

export function EvolutionProvider({ children }: { children: React.ReactNode }) {
  const { sessionsHistory } = useWorkout();
  const [measurements, setMeasurements] = useState<BodyMeasurementItem[]>([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<EvolutionTimeRange>('30d');
  const measurementsLoadedRef = useRef(false);
  const measurementsLoadPromiseRef = useRef<Promise<void> | null>(null);

  // Medidas corporais são dados de uma tela secundária. A leitura é adiada até
  // o usuário abrir Evolução, evitando uma transação IndexedDB no boot inicial.
  const refreshMeasurements = useCallback(async () => {
    if (measurementsLoadPromiseRef.current) return measurementsLoadPromiseRef.current;

    setIsLoadingMeasurements(true);
    const loadPromise = (async () => {
      try {
        const items = await dbService.getBodyMeasurements();
        setMeasurements(items);
        measurementsLoadedRef.current = true;
      } catch (err) {
        console.error('Falha ao carregar medidas corporais:', err);
        throw err;
      } finally {
        setIsLoadingMeasurements(false);
        measurementsLoadPromiseRef.current = null;
      }
    })();
    measurementsLoadPromiseRef.current = loadPromise;
    return loadPromise;
  }, []);

  const ensureMeasurementsLoaded = useCallback(async () => {
    if (measurementsLoadedRef.current) return;
    await refreshMeasurements();
  }, [refreshMeasurements]);

  const saveMeasurement = useCallback(
    async (item: BodyMeasurementItem) => {
      await dbService.saveBodyMeasurement(item);
      await refreshMeasurements();
    },
    [refreshMeasurements]
  );

  const deleteMeasurement = useCallback(
    async (id: string) => {
      await dbService.deleteBodyMeasurement(id);
      await refreshMeasurements();
    },
    [refreshMeasurements]
  );

  // Computa métricas gerais com base nas sessões concluídas do WorkoutContext
  const overallMetrics = useMemo(() => {
    return calculateOverallEvolutionMetrics(sessionsHistory, selectedTimeRange);
  }, [sessionsHistory, selectedTimeRange]);

  // Computa recordes pessoais
  const personalRecords = useMemo(() => {
    return calculatePersonalRecords(sessionsHistory);
  }, [sessionsHistory]);

  const exportJson = useCallback(() => {
    return exportEvolutionReportJson(sessionsHistory, measurements);
  }, [sessionsHistory, measurements]);

  const exportCsv = useCallback(() => {
    return exportEvolutionReportCsv(sessionsHistory, measurements);
  }, [sessionsHistory, measurements]);

  return (
    <EvolutionContext.Provider
      value={{
        measurements,
        isLoadingMeasurements,
        selectedTimeRange,
        setSelectedTimeRange,
        refreshMeasurements,
        ensureMeasurementsLoaded,
        saveMeasurement,
        deleteMeasurement,
        overallMetrics,
        personalRecords,
        exportJson,
        exportCsv,
      }}
    >
      {children}
    </EvolutionContext.Provider>
  );
}

export function useEvolution(): EvolutionContextType {
  const context = useContext(EvolutionContext);
  if (!context) {
    throw new Error('useEvolution deve ser utilizado dentro de um EvolutionProvider');
  }
  return context;
}
