import "server-only";
import { prisma } from "@/lib/prisma";

export async function listPayments(search?: string) {
  return prisma.payment.findMany({
    where: search
      ? {
          OR: [
            { referenceNumber: { contains: search, mode: "insensitive" } },
            { job: { billNumber: { contains: search, mode: "insensitive" } } },
            { job: { customer: { customerName: { contains: search, mode: "insensitive" } } } },
          ],
        }
      : {},
    orderBy: { paymentDate: "desc" },
    include: {
      job: {
        select: {
          id: true,
          billNumber: true,
          grandTotal: true,
          customer: { select: { customerName: true } },
        },
      },
    },
  });
}

/** Jobs with an outstanding balance, for the pending-payments views. */
export async function getOutstandingJobs() {
  const jobs = await prisma.borewellJob.findMany({
    where: { status: { in: ["UNPAID", "PARTIAL"] } },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { customerName: true, mobile: true } },
      payments: { select: { amount: true } },
    },
  });
  return jobs.map((j) => {
    const paid = j.payments.reduce((s, p) => s + Number(p.amount), 0);
    return { ...j, paid, balance: Number(j.grandTotal) - paid };
  });
}
