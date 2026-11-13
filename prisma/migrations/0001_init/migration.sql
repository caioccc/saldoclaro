CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "startMonth" TEXT NOT NULL,
    "horizonMonths" INTEGER,
    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MonthBudget" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "initialValue" DECIMAL(14,2) NOT NULL,
    CONSTRAINT "MonthBudget_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DebtItem" (
    "id" TEXT NOT NULL,
    "simulationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "installments" INTEGER NOT NULL,
    "startMonth" TEXT NOT NULL,
    "creditInPreviousMonth" BOOLEAN NOT NULL DEFAULT false,
    "creditMonth" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DebtItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL,
    "fees" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MonthBudget_simulationId_year_month_key"
ON "MonthBudget"("simulationId", "year", "month");

CREATE INDEX "MonthBudget_simulationId_idx" ON "MonthBudget"("simulationId");
CREATE INDEX "DebtItem_simulationId_idx" ON "DebtItem"("simulationId");

ALTER TABLE "MonthBudget"
ADD CONSTRAINT "MonthBudget_simulationId_fkey"
FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DebtItem"
ADD CONSTRAINT "DebtItem_simulationId_fkey"
FOREIGN KEY ("simulationId") REFERENCES "Simulation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
