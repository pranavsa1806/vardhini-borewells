"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validators";
import { refreshJobStatus, paidAmount } from "@/lib/services/bills";
import { authorize, run, type ActionResult } from "./guard";
import { JobStatus } from "@prisma/client";

export async function recordPayment(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("payments:record");
    const data = paymentSchema.parse(input);

    await prisma.$transaction(async (tx) => {
      const job = await tx.borewellJob.findUnique({
        where: { id: data.jobId },
        include: { payments: true },
      });
      if (!job) throw new Error("Bill not found.");
      if (job.status === JobStatus.CANCELLED) throw new Error("Cannot record payment on a cancelled bill.");

      const alreadyPaid = paidAmount(job.payments);
      const balance = Number(job.grandTotal) - alreadyPaid;
      if (data.amount > balance + 0.01) {
        throw new Error(`Amount exceeds outstanding balance (₹${balance.toFixed(2)}).`);
      }

      await tx.payment.create({
        data: {
          jobId: data.jobId,
          amount: data.amount,
          paymentMode: data.paymentMode,
          referenceNumber: data.referenceNumber || null,
          paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        },
      });
      await refreshJobStatus(data.jobId, tx);
    });

    revalidatePath("/payments");
    revalidatePath("/bills");
    revalidatePath("/dashboard");
  });
}
