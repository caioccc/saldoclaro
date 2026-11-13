import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let schemaPromise: Promise<void> | null = null;

export function ensureDatabaseSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = prisma
      .$transaction(async (transaction) => {
        await transaction.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT PRIMARY KEY,
            "email" TEXT NOT NULL UNIQUE,
            "passwordHash" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL
          )
        `);
        await transaction.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Simulation" (
            "id" TEXT PRIMARY KEY,
            "ownerId" TEXT,
            "name" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL,
            "startMonth" TEXT NOT NULL,
            "horizonMonths" INTEGER
          )
        `);
        await transaction.$executeRawUnsafe(`
          ALTER TABLE "Simulation"
          ADD COLUMN IF NOT EXISTS "ownerId" TEXT
        `);
        await transaction.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "MonthBudget" (
            "id" TEXT PRIMARY KEY,
            "simulationId" TEXT NOT NULL REFERENCES "Simulation"("id") ON DELETE CASCADE,
            "month" INTEGER NOT NULL,
            "year" INTEGER NOT NULL,
            "initialValue" DECIMAL(14, 2) NOT NULL,
            UNIQUE ("simulationId", "year", "month")
          )
        `);
        await transaction.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "DebtItem" (
            "id" TEXT PRIMARY KEY,
            "simulationId" TEXT NOT NULL REFERENCES "Simulation"("id") ON DELETE CASCADE,
            "name" TEXT NOT NULL,
            "netAmount" DECIMAL(14, 2) NOT NULL,
            "installments" INTEGER NOT NULL,
            "startMonth" TEXT NOT NULL,
            "creditInPreviousMonth" BOOLEAN NOT NULL DEFAULT false,
            "creditMonth" TEXT,
            "active" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL
          )
        `);
        await transaction.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "AppSettings" (
            "id" TEXT PRIMARY KEY,
            "fees" JSONB NOT NULL,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);
      })
      .then(() => undefined)
      .catch((error: unknown) => {
        schemaPromise = null;
        throw error;
      });
  }

  return schemaPromise ?? Promise.resolve();
}
