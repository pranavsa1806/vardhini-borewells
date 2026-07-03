/**
 * Master-data access layer: borewell types, drilling slabs, additional charges.
 * All reads used by the billing engine live here so pricing stays 100%
 * database-driven.
 */
import "server-only";
import { prisma } from "@/lib/prisma";

/** Sort helper: order by numeric diameter (so "4.75" precedes "8"). */
function byDiameter<T extends { diameterName: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => parseFloat(a.diameterName) - parseFloat(b.diameterName));
}

export async function getBorewellTypes(activeOnly = false) {
  const rows = await prisma.borewellType.findMany({
    where: activeOnly ? { isActive: true } : undefined,
  });
  return byDiameter(rows);
}

export async function getBorewellTypesWithUsage() {
  const rows = await prisma.borewellType.findMany({
    include: { _count: { select: { borewellJobs: true, drillingRateSlabs: true } } },
  });
  return byDiameter(rows);
}

/** Slabs for one borewell type, ordered by depth — used by the calc engine. */
export async function getSlabsForType(borewellTypeId: number) {
  return prisma.drillingRateSlab.findMany({
    where: { borewellTypeId },
    orderBy: { startDepth: "asc" },
  });
}

export async function getAllSlabs() {
  return prisma.drillingRateSlab.findMany({
    orderBy: [{ borewellTypeId: "asc" }, { startDepth: "asc" }],
    include: { borewellType: true },
  });
}

/** Active additional-charge rates available for a borewell type. */
export async function getChargeRatesForType(borewellTypeId: number) {
  return prisma.additionalChargeRate.findMany({
    where: { borewellTypeId, isActive: true, chargeType: { isActive: true } },
    include: { chargeType: true },
    orderBy: { id: "asc" },
  });
}

export async function getAllChargeRates() {
  return prisma.additionalChargeRate.findMany({
    orderBy: [{ borewellTypeId: "asc" }, { id: "asc" }],
    include: { chargeType: true, borewellType: true },
  });
}

export async function getChargeTypes() {
  return prisma.additionalChargeType.findMany({ orderBy: { id: "asc" } });
}
