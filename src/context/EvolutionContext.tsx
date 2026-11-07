/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  const refreshMeasurements = useCallback(async () => {
    try {
      setIsLoadingMeasurements(true);
      const items = await dbService.getBodyMeasurements();
      setMeasurements(items);
    } catch (err) {
      console.error('Falha ao carregar medidas corporais:', err);
    } finally {
      setIsLoadingMeasurements(false);
    }
  }, []);

  useEffect(() => {
    refreshMeasurements();
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
