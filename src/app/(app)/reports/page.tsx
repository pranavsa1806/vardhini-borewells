import { redirect } from "next/navigation";
import { getReportsData } from "@/lib/services/reports";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { ReportsExport } from "./reports-export";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee, Wallet, TrendingUp, Ruler } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports — Vardhini Borewells" };

export default async function ReportsPage() {
  const user = await getSession();
  if (!can(user?.role, "reports:view")) redirect("/dashboard");

  const d = await getReportsData();

  return (
    <>
      <PageHeader title="Reports" description="Revenue, collections and drilling insights.">
        <ReportsExport monthly={d.monthly} byType={d.byType} totals={d.totals} />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Billed" value={formatCurrency(d.totals.totalBilled)} icon={IndianRupee} accent="primary" />
        <StatCard label="Total Collected" value={formatCurrency(d.totals.totalCollected)} icon={Wallet} accent="blue" />
        <StatCard label="Outstanding" value={formatCurrency(d.totals.outstanding)} icon={TrendingUp} accent="amber" />
        <StatCard label="Avg Depth" value={`${d.totals.avgDepth} ft`} icon={Ruler} hint={`${d.totals.jobCount} jobs`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue — last 12 months</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={d.monthly.map((m) => ({ month: m.month, revenue: m.revenue }))} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Borewell Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={d.byType.map((t) => ({ name: t.name, value: t.revenue }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Borewell Type</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={d.byType.map((t) => ({ name: t.name, value: t.jobs }))} currency={false} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
