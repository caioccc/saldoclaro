export interface FeeTable {
  [installments: number]: number;
}

export interface DebtItem {
  id: string;
  name: string;
  netAmount: number;
  installments: number;
  startMonth: string;
  creditInPreviousMonth: boolean;
  creditMonth?: string;
  active: boolean;
  createdAt: string;
}

export interface MonthBudget {
  "mês": number;
  ano: number;
  sobraInicial: number;
}

export interface Simulation {
  id: string;
  name: string;
  createdAt: string;
  startMonth: string;
  horizonMonths?: number;
  budgets: Record<string, number>;
  debts: DebtItem[];
}

export interface AppState {
  version: 1;
  simulations: Simulation[];
  activeSimulationId: string;
  fees: FeeTable;
}

export interface DebtCalculation {
  netAmount: number;
  grossAmount: number;
  installments: number;
  feePercent: number;
  installmentAmount: number;
  feeCost: number;
}

export interface MonthDebtOccupancy {
  debtId: string;
  name: string;
  installmentNumber: number;
  installments: number;
  amount: number;
  percentOfBudget: number;
}

export interface MonthDebtCredit {
  debtId: string;
  name: string;
  amount: number;
}

export interface MonthProjection {
  key: string;
  index: number;
  monthLabel: string;
  shortLabel: string;
  referenceMonth: string;
  referenceMonthLabel: string;
  budget: number;
  creditAmount: number;
  available: number;
  occupied: number;
  remaining: number;
  freePercent: number;
  isOverBudget: boolean;
  credits: MonthDebtCredit[];
  debts: MonthDebtOccupancy[];
}

export interface SimulationSummary {
  totalBudget: number;
  totalCredits: number;
  totalAvailable: number;
  totalOccupied: number;
  remaining: number;
  totalFees: number;
  totalGross: number;
  activeDebts: number;
  overBudgetMonths: number;
  commitmentPercent: number;
}

export interface DebtFormValues {
  name: string;
  netAmount: number;
  installments: number;
  startMonth: string;
  creditInPreviousMonth: boolean;
  creditMonth?: string;
}
