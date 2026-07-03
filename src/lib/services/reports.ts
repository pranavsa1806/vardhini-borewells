import "server-only";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getReportsData() {
  const now = new Date();

  // Monthly revenue + job count for last 12 months.
  const monthly = await Promise.all(
    Array.from({ length: 12 }).map(async (_, i) => {
      const d = subMonths(now, 11 - i);
      const s = startOfMonth(d);
      const e = endOfMonth(d);
      const [rev, count] = await Promise.all([
        prisma.borewellJob.aggregate({
          _sum: { grandTotal: true },
          where: { drillingDate: { gte: s, lte: e }, status: { not: JobStatus.CANCELLED } },
        }),
        prisma.borewellJob.count({
          where: { drillingDate: { gte: s, lte: e }, status: { not: JobStatus.CANCELLED } },
        }),
      ]);
      return { month: format(d, "MMM yy"), revenue: Number(rev._sum.grandTotal ?? 0), jobs: count };
    }),
  );

  // Revenue by borewell type.
  const byTypeRaw = await prisma.borewellJob.groupBy({
    by: ["borewellTypeId"],
    _sum: { grandTotal: true },
    _count: { _all: true },
    where: { status: { not: JobStatus.CANCELLED } },
  });
  const types = await prisma.borewellType.findMany();
  const typeMap = new Map(types.map((t) => [t.id, t.diameterName]));
  const byType = byTypeRaw.map((r) => ({
    name: `${typeMap.get(r.borewellTypeId) ?? "?"}"`,
    revenue: Number(r._sum.grandTotal ?? 0),
    jobs: r._count._all,
  }));

  // Totals.
  const [billedAgg, paidAgg, jobCount, avgDepthAgg] = await Promise.all([
    prisma.borewellJob.aggregate({ _sum: { grandTotal: true }, where: { status: { not: JobStatus.CANCELLED } } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.borewellJob.count({ where: { status: { not: JobStatus.CANCELLED } } }),
    prisma.borewellJob.aggregate({ _avg: { totalDepth: true }, where: { status: { not: JobStatus.CANCELLED } } }),
  ]);

  const totalBilled = Number(billedAgg._sum.grandTotal ?? 0);
  const totalCollected = Number(paidAgg._sum.amount ?? 0);

  return {
    monthly,
    byType,
    totals: {
      totalBilled,
      totalCollected,
      outstanding: Math.max(0, totalBilled - totalCollected),
      jobCount,
      avgDepth: Math.round(Number(avgDepthAgg._avg.totalDepth ?? 0)),
    },
  };
}
