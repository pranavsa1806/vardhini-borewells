"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slabSchema, borewellTypeSchema, chargeRateSchema, chargeTypeSchema } from "@/lib/validators";
import { logRateChange } from "@/lib/audit";
import { authorize, run, type ActionResult } from "./guard";

function revalidateMaster() {
  revalidatePath("/master/drilling-rates");
  revalidatePath("/master/borewell-types");
  revalidatePath("/master/additional-charges");
  revalidatePath("/master/rate-history");
}

// ---------------- Borewell types ----------------

export async function createBorewellType(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("borewellTypes:manage");
    const data = borewellTypeSchema.parse(input);
    await prisma.borewellType.create({ data: { diameterName: data.diameterName, isActive: data.isActive } });
    revalidateMaster();
  });
}

export async function updateBorewellType(id: number, input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("borewellTypes:manage");
    const data = borewellTypeSchema.parse(input);
    await prisma.borewellType.update({
      where: { id },
      data: { diameterName: data.diameterName, isActive: data.isActive },
    });
    revalidateMaster();
  });
}

export async function deleteBorewellType(id: number): Promise<ActionResult> {
  return run(async () => {
    await authorize("borewellTypes:manage");
    const jobs = await prisma.borewellJob.count({ where: { borewellTypeId: id } });
    if (jobs > 0) throw new Error("Cannot delete a borewell type used by existing bills. Disable it instead.");
    await prisma.$transaction([
      prisma.drillingRateSlab.deleteMany({ where: { borewellTypeId: id } }),
      prisma.additionalChargeRate.deleteMany({ where: { borewellTypeId: id } }),
      prisma.borewellType.delete({ where: { id } }),
    ]);
    revalidateMaster();
  });
}

// ---------------- Drilling slabs ----------------

export async function createSlab(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize("rates:manage");
    const data = slabSchema.parse(input);
    const slab = await prisma.drillingRateSlab.create({
      data: {
        borewellTypeId: data.borewellTypeId,
        startDepth: data.startDepth,
        endDepth: data.endDepth,
        pricePerFt: data.pricePerFt,
      },
    });
    await logRateChange({
      tableName: "drilling_rate_slabs",
      recordId: slab.id,
      fieldName: "created",
      newValue: `${data.startDepth}-${data.endDepth} @ ₹${data.pricePerFt}/ft`,
      changedById: user.id,
      reason: data.reason || "New slab added",
    });
    revalidateMaster();
  });
}

export async function updateSlab(id: number, input: unknown): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize("rates:manage");
    const data = slabSchema.parse(input);
    const before = await prisma.drillingRateSlab.findUnique({ where: { id } });
    if (!before) throw new Error("Slab not found.");

    await prisma.drillingRateSlab.update({
      where: { id },
      data: {
        startDepth: data.startDepth,
        endDepth: data.endDepth,
        pricePerFt: data.pricePerFt,
      },
    });

    // Audit — record the rate change if the price moved.
    if (Number(before.pricePerFt) !== data.pricePerFt) {
      await logRateChange({
        tableName: "drilling_rate_slabs",
        recordId: id,
        fieldName: "price_per_ft",
        oldValue: `₹${Number(before.pricePerFt)}`,
        newValue: `₹${data.pricePerFt}`,
        changedById: user.id,
        reason: data.reason || null,
      });
    }
    revalidateMaster();
  });
}

export async function deleteSlab(id: number): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize("rates:manage");
    const before = await prisma.drillingRateSlab.findUnique({ where: { id } });
    await prisma.drillingRateSlab.delete({ where: { id } });
    if (before) {
      await logRateChange({
        tableName: "drilling_rate_slabs",
        recordId: id,
        fieldName: "deleted",
        oldValue: `${before.startDepth}-${before.endDepth} @ ₹${Number(before.pricePerFt)}/ft`,
        changedById: user.id,
      });
    }
    revalidateMaster();
  });
}

// ---------------- Additional charge types ----------------

export async function createChargeType(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("charges:manage");
    const data = chargeTypeSchema.parse(input);
    // Block case-insensitive duplicates (e.g. "Bore Flushing" vs "BORE FLUSHING").
    const existing = await prisma.additionalChargeType.findFirst({
      where: { name: { equals: data.name.trim(), mode: "insensitive" } },
    });
    if (existing) throw new Error(`A charge named "${existing.name}" already exists.`);
    await prisma.additionalChargeType.create({
      data: { name: data.name.trim(), description: data.description || null },
    });
    revalidateMaster();
  });
}

// ---------------- Additional charge rates ----------------

export async function upsertChargeRate(id: number | null, input: unknown): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize("charges:manage");
    const data = chargeRateSchema.parse(input);

    if (id) {
      const before = await prisma.additionalChargeRate.findUnique({ where: { id } });
      await prisma.additionalChargeRate.update({
        where: { id },
        data: { price: data.price, unit: data.unit, isActive: data.isActive },
      });
      if (before && Number(before.price) !== data.price) {
        await logRateChange({
          tableName: "additional_charge_rates",
          recordId: id,
          fieldName: "price",
          oldValue: `₹${Number(before.price)}`,
          newValue: `₹${data.price}`,
          changedById: user.id,
          reason: data.reason || null,
        });
      }
    } else {
      await prisma.additionalChargeRate.create({
        data: {
          additionalChargeTypeId: data.additionalChargeTypeId,
          borewellTypeId: data.borewellTypeId,
          price: data.price,
          unit: data.unit,
          isActive: data.isActive,
        },
      });
    }
    revalidateMaster();
  });
}

export async function deleteChargeRate(id: number): Promise<ActionResult> {
  return run(async () => {
    await authorize("charges:manage");
    await prisma.additionalChargeRate.delete({ where: { id } });
    revalidateMaster();
  });
}
