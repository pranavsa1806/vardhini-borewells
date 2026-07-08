import "server-only";
import { prisma } from "@/lib/prisma";

/** Everything the Create Bill wizard needs, so live calculation can happen
 * client-side using the exact DB rates (the server re-verifies on save). */
export async function getBillFormData() {
  const [typesRaw, chargeRates] = await Promise.all([
    prisma.borewellType.findMany({
      where: { isActive: true },
      include: { drillingRateSlabs: { orderBy: { startDepth: "asc" } } },
    }),
    prisma.additionalChargeRate.findMany({
      where: { isActive: true, chargeType: { isActive: true } },
      include: { chargeType: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const types = [...typesRaw].sort((a, b) => parseFloat(a.diameterName) - parseFloat(b.diameterName));

  return {
    borewellTypes: types.map((t) => ({
      id: t.id,
      diameterName: t.diameterName,
      slabs: t.drillingRateSlabs.map((s) => ({
        id: s.id,
        startDepth: s.startDepth,
        endDepth: s.endDepth,
        pricePerFt: Number(s.pricePerFt),
      })),
    })),
    chargeRates: chargeRates.map((r) => ({
      id: r.id,
      chargeTypeId: r.additionalChargeTypeId,
      borewellTypeId: r.borewellTypeId,
      name: r.chargeType.name,
      price: Number(r.price),
      unit: r.unit as "PER_FT" | "PER_DAY" | "PER_HOLE" | "FIXED",
    })),
  };
}
