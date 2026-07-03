"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createBillSchema } from "@/lib/validators";
import { buildBill, createBill as createBillService } from "@/lib/services/bills";
import { authorize, run, type ActionResult } from "./guard";
import { JobStatus } from "@prisma/client";

/** Live preview — recompute totals server-side from DB rates (no DB writes). */
export async function previewBill(input: unknown) {
  return run(async () => {
    await authorize("bills:create");
    const data = createBillSchema.parse(input);
    return buildBill(data);
  });
}

export async function createBill(input: unknown): Promise<ActionResult<{ id: number; billNumber: string }>> {
  return run(async () => {
    const user = await authorize("bills:create");
    const data = createBillSchema.parse(input);
    const result = await createBillService(data, user.id);
    revalidatePath("/bills");
    revalidatePath("/dashboard");
    return result;
  });
}

export async function cancelBill(id: number, reason: string): Promise<ActionResult> {
  return run(async () => {
    await authorize("bills:cancel");
    if (!reason.trim()) throw new Error("A cancellation reason is required.");
    await prisma.borewellJob.update({
      where: { id },
      data: { status: JobStatus.CANCELLED, cancelledAt: new Date(), cancelledReason: reason.trim() },
    });
    revalidatePath("/bills");
    revalidatePath(`/bills/${id}`);
    revalidatePath("/dashboard");
  });
}

/** Duplicate an existing bill's inputs into a fresh draft (returns prefill). */
export async function duplicateBillData(id: number) {
  return run(async () => {
    await authorize("bills:create");
    const job = await prisma.borewellJob.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!job) throw new Error("Bill not found.");
    return {
      customerId: job.customerId,
      borewellTypeId: job.borewellTypeId,
      totalDepth: job.totalDepth,
      waterLevel: job.waterLevel,
      remarks: job.remarks,
      discount: Number(job.discount),
    };
  });
}
