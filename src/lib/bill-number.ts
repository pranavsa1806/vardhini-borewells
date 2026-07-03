/**
 * Auto-generated bill numbers in the form <PREFIX>-<YYYY>-<0001>.
 * Sequence restarts each calendar year. Must run inside the same transaction
 * that creates the job to stay collision-free under concurrency.
 */
import type { Prisma } from "@prisma/client";

export async function generateBillNumber(
  tx: Prisma.TransactionClient,
  prefix: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  // Find the highest existing number for this year.
  const last = await tx.borewellJob.findFirst({
    where: { billNumber: { startsWith: yearPrefix } },
    orderBy: { billNumber: "desc" },
    select: { billNumber: true },
  });

  let next = 1;
  if (last) {
    const seq = parseInt(last.billNumber.split("-").pop() || "0", 10);
    if (!Number.isNaN(seq)) next = seq + 1;
  }

  return `${yearPrefix}${String(next).padStart(4, "0")}`;
}
