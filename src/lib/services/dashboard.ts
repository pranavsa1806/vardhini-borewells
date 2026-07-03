import "server-only";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getDashboardData() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    todaysBills,
    todaysRevenueAgg,
    monthlyRevenueAgg,
    completedJobs,
    allJobsAgg,
    paymentsAgg,
    recentBills,
    revenueByMonthRaw,
    topCustomersRaw,
  ] = await Promise.all([
    prisma.borewellJob.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd }, status: { not: JobStatus.CANCELLED } },
    }),
    prisma.borewellJob.aggregate({
      _sum: { grandTotal: true },
      where: { drillingDate: { gte: todayStart, lte: todayEnd }, status: { not: JobStatus.CANCELLED } },
    }),
    prisma.borewellJob.aggregate({
      _sum: { grandTotal: true },
      where: { drillingDate: { gte: monthStart, lte: monthEnd }, status: { not: JobStatus.CANCELLED } },
    }),
    prisma.borewellJob.count({ where: { status: JobStatus.PAID } }),
    prisma.borewellJob.aggregate({
      _sum: { grandTotal: true },
      where: { status: { not: JobStatus.CANCELLED } },
    }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.borewellJob.findMany({
      where: { status: { not: JobStatus.CANCELLED } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        customer: { select: { customerName: true } },
        borewellType: { select: { diameterName: true } },
      },
    }),
    // Revenue for the last 6 months.
    Promise.all(
      Array.from({ length: 6 }).map(async (_, i) => {
        const d = subMonths(now, 5 - i);
        const s = startOfMonth(d);
        const e = endOfMonth(d);
        const agg = await prisma.borewellJob.aggregate({
          _sum: { grandTotal: true },
          where: { drillingDate: { gte: s, lte: e }, status: { not: JobStatus.CANCELLED } },
        });
        return { month: format(d, "MMM"), revenue: Number(agg._sum.grandTotal ?? 0) };
      }),
    ),
    prisma.borewellJob.groupBy({
      by: ["customerId"],
      _sum: { grandTotal: true },
      _count: { _all: true },
      where: { status: { not: JobStatus.CANCELLED } },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 5,
    }),
  ]);

  const totalBilled = Number(allJobsAgg._sum.grandTotal ?? 0);
  const totalPaid = Number(paymentsAgg._sum.amount ?? 0);
  const pendingPayments = Math.max(0, totalBilled - totalPaid);

  // Resolve top-customer names.
  const topCustomerIds = topCustomersRaw.map((t) => t.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: topCustomerIds } },
    select: { id: true, customerName: true, mobile: true },
  });
  const custMap = new Map(customers.map((c) => [c.id, c]));
  const topCustomers = topCustomersRaw.map((t) => ({
    id: t.customerId,
    name: custMap.get(t.customerId)?.customerName ?? "—",
    mobile: custMap.get(t.customerId)?.mobile ?? "",
    revenue: Number(t._sum.grandTotal ?? 0),
    jobs: t._count._all,
  }));

  return {
    todaysBills,
    todaysRevenue: Number(todaysRevenueAgg._sum.grandTotal ?? 0),
    monthlyRevenue: Number(monthlyRevenueAgg._sum.grandTotal ?? 0),
    completedJobs,
    pendingPayments,
    totalBilled,
    recentBills,
    revenueByMonth: revenueByMonthRaw,
    topCustomers,
  };
}
