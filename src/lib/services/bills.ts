/**
 * Bill (borewell job) service. The billing engine recomputes every price from
 * the database at save time so a bill can never be tampered with client-side
 * and always reflects the current slab/charge rates.
 */
import "server-only";
import { prisma } from "@/lib/prisma";
import { generateBillNumber } from "@/lib/bill-number";
import {
  calculateDrilling,
  calculateAdditionalCharge,
  calculateBillTotals,
  unitLabel,
  type ChargeUnit,
} from "@/lib/calc";
import type { CreateBillInput } from "@/lib/validators";
import { JobStatus, type Prisma } from "@prisma/client";

export interface BuiltLineItem {
  itemType: "DRILLING" | "ADDITIONAL";
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface BuiltBill {
  items: BuiltLineItem[];
  drillingTotal: number;
  additionalTotal: number;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  drillingRows: ReturnType<typeof calculateDrilling>["rows"];
  exceedsSlabs: boolean;
  uncoveredFeet: number;
}

/**
 * Pure builder: given the input and DB rate rows, produce all line items and
 * totals. Shared by the live preview API and the save transaction so they can
 * never diverge.
 */
export async function buildBill(
  input: CreateBillInput,
  db: Prisma.TransactionClient = prisma,
): Promise<BuiltBill> {
  // Drilling — read slabs for the chosen type.
  const slabs = await db.drillingRateSlab.findMany({
    where: { borewellTypeId: input.borewellTypeId },
    orderBy: { startDepth: "asc" },
  });
  const drilling = calculateDrilling(
    input.totalDepth,
    slabs.map((s) => ({ id: s.id, startDepth: s.startDepth, endDepth: s.endDepth, pricePerFt: Number(s.pricePerFt) })),
  );

  const items: BuiltLineItem[] = drilling.rows.map((r) => ({
    itemType: "DRILLING" as const,
    description: `Drilling ${r.label} ft`,
    quantity: r.feet,
    unit: "ft",
    rate: r.ratePerFt,
    amount: r.amount,
  }));

  // Additional charges — look up each selected rate and price it.
  let additionalTotal = 0;
  if (input.charges.length > 0) {
    const rateIds = input.charges.map((c) => c.chargeRateId);
    const rates = await db.additionalChargeRate.findMany({
      where: { id: { in: rateIds } },
      include: { chargeType: true },
    });
    const rateMap = new Map(rates.map((r) => [r.id, r]));

    for (const line of input.charges) {
      const rate = rateMap.get(line.chargeRateId);
      if (!rate) continue;
      const unit = rate.unit as ChargeUnit;
      const amount = calculateAdditionalCharge({
        price: Number(rate.price),
        unit,
        quantity: line.quantity,
      });
      const qty = unit === "FIXED" ? 1 : line.quantity;
      if (qty <= 0 && unit !== "FIXED") continue;
      additionalTotal += amount;
      items.push({
        itemType: "ADDITIONAL",
        description: rate.chargeType.name,
        quantity: qty,
        unit: unitLabel(unit),
        rate: Number(rate.price),
        amount,
      });
    }
  }

  const totals = calculateBillTotals({
    drillingTotal: drilling.total,
    additionalTotal,
    discount: input.discount,
    taxRate: input.taxRate,
  });

  return {
    items,
    drillingTotal: drilling.total,
    additionalTotal,
    subtotal: totals.subtotal,
    discount: totals.discount,
    taxRate: input.taxRate,
    taxAmount: totals.taxAmount,
    grandTotal: totals.grandTotal,
    drillingRows: drilling.rows,
    exceedsSlabs: drilling.exceedsSlabs,
    uncoveredFeet: drilling.uncoveredFeet,
  };
}

/** Create a bill atomically: build line items, generate number, insert. */
export async function createBill(input: CreateBillInput, userId: number) {
  return prisma.$transaction(async (tx) => {
    const built = await buildBill(input, tx);

    const setting = await tx.companySetting.findFirst();
    const prefix = setting?.billPrefix || "VB";
    const billNumber = await generateBillNumber(tx, prefix);

    const job = await tx.borewellJob.create({
      data: {
        billNumber,
        customerId: input.customerId,
        borewellTypeId: input.borewellTypeId,
        drillingDate: new Date(input.drillingDate),
        totalDepth: input.totalDepth,
        waterLevel: input.waterLevel ?? null,
        remarks: input.remarks || null,
        subtotal: built.subtotal,
        discount: built.discount,
        taxRate: built.taxRate,
        taxAmount: built.taxAmount,
        grandTotal: built.grandTotal,
        status: JobStatus.UNPAID,
        createdById: userId,
        items: {
          create: built.items.map((it) => ({
            itemType: it.itemType,
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            rate: it.rate,
            amount: it.amount,
          })),
        },
      },
    });

    return { id: job.id, billNumber: job.billNumber };
  });
}

/** Full bill with everything needed to render the printable receipt. */
export async function getBillById(id: number) {
  return prisma.borewellJob.findUnique({
    where: { id },
    include: {
      customer: true,
      borewellType: true,
      createdBy: { select: { name: true, username: true } },
      items: { orderBy: { id: "asc" } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
}

export interface BillListFilters {
  search?: string;
  status?: JobStatus;
}

export async function listBills(filters: BillListFilters = {}) {
  const where: Prisma.BorewellJobWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { billNumber: { contains: filters.search, mode: "insensitive" } },
      { customer: { customerName: { contains: filters.search, mode: "insensitive" } } },
      { customer: { mobile: { contains: filters.search } } },
    ];
  }
  return prisma.borewellJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { customerName: true, mobile: true } },
      borewellType: { select: { diameterName: true } },
      payments: { select: { amount: true } },
    },
  });
}

/** Sum of payments recorded against a job. */
export function paidAmount(payments: { amount: unknown }[]): number {
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

/** Recompute a job's status from its payments. */
export async function refreshJobStatus(jobId: number, tx: Prisma.TransactionClient = prisma) {
  const job = await tx.borewellJob.findUnique({
    where: { id: jobId },
    include: { payments: true },
  });
  if (!job || job.status === JobStatus.CANCELLED) return;
  const paid = paidAmount(job.payments);
  const grand = Number(job.grandTotal);
  let status: JobStatus = JobStatus.UNPAID;
  if (paid >= grand && grand > 0) status = JobStatus.PAID;
  else if (paid > 0) status = JobStatus.PARTIAL;
  await tx.borewellJob.update({ where: { id: jobId }, data: { status } });
}
