import Link from "next/link";
import { getDashboardData } from "@/lib/services/dashboard";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import {
  ReceiptText,
  IndianRupee,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowUpRight,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard — Vardhini Borewells" };

export default async function DashboardPage() {
  const d = await getDashboardData();

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your borewell business.">
        <Button asChild>
          <Link href="/bills/new">
            <PlusCircle className="h-4 w-4" /> Create Bill
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's Bills" value={d.todaysBills} icon={ReceiptText} accent="blue" />
        <StatCard label="Today's Revenue" value={formatCurrency(d.todaysRevenue)} icon={IndianRupee} accent="primary" />
        <StatCard label="Monthly Revenue" value={formatCurrency(d.monthlyRevenue)} icon={CalendarClock} accent="primary" />
        <StatCard
          label="Pending Payments"
          value={formatCurrency(d.pendingPayments)}
          icon={AlertTriangle}
          accent="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Revenue — last 6 months</CardTitle>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> {d.completedJobs} completed jobs
            </span>
          </CardHeader>
          <CardContent>
            <RevenueChart data={d.revenueByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Top Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-1">
            {d.topCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
            ) : (
              d.topCustomers.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.jobs} jobs</p>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(c.revenue)}</span>
                  <span className="w-4 text-center text-xs text-muted-foreground">#{i + 1}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Bills</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bills">
              View all <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {d.recentBills.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No bills yet" description="Create your first bill to get started.">
              <Button asChild className="mt-2">
                <Link href="/bills/new">
                  <PlusCircle className="h-4 w-4" /> Create Bill
                </Link>
              </Button>
            </EmptyState>
          ) : (
            <div className="divide-y divide-border/60">
              {d.recentBills.map((b) => (
                <Link
                  key={b.id}
                  href={`/bills/${b.id}`}
                  className="flex items-center gap-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b.customer.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.billNumber} · {b.borewellType.diameterName}" · {b.totalDepth} ft
                    </p>
                  </div>
                  <span className="hidden text-sm text-muted-foreground sm:block">{formatDate(b.drillingDate)}</span>
                  <StatusBadge status={b.status} />
                  <span className="w-24 text-right font-semibold">{formatCurrency(Number(b.grandTotal))}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
