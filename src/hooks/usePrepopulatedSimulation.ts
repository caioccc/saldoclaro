"use client";

import { useCallback } from "react";
import type { AppState, Simulation } from "@/types";
import {
  STORAGE_KEY,
  createDefaultAppState,
  createSimulation,
  deserializeAppState,
} from "@/lib/storage";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  PREPOPULATED_START_MONTH,
  budgetToMonthKey,
  generatePrepopulatedBudgets,
  referenceMonthToOperationalMonthKey,
} from "@/utils/prepopulate";

export function usePrepopulatedSimulation() {
  const { setValue, hydrated } = useLocalStorageState<AppState>(
    STORAGE_KEY,
    createDefaultAppState,
    { deserialize: deserializeAppState, persist: false },
  );

  const createSimulationFromTableData = useCallback(
    (name: string): Simulation => {
      const budgets = generatePrepopulatedBudgets();
      const budgetRecord: Record<string, number> = {};

      for (const budget of budgets) {
        const referenceMonth = budgetToMonthKey(budget);
        budgetRecord[referenceMonthToOperationalMonthKey(referenceMonth)] =
          budget.sobraInicial;
      }

      const simulation: Simulation = {
        ...createSimulation(name, PREPOPULATED_START_MONTH),
        horizonMonths: budgets.length,
        budgets: budgetRecord,
      };

      setValue((previous) => ({
        ...previous,
        simulations: [simulation, ...previous.simulations],
        activeSimulationId: simulation.id,
      }));

      return simulation;
    },
    [setValue],
  );

  return { createSimulationFromTableData, hydrated };
}
