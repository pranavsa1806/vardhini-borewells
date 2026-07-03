import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import { History, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rate History — Master Data" };

const TABLE_LABELS: Record<string, string> = {
  drilling_rate_slabs: "Drilling Slab",
  additional_charge_rates: "Additional Charge",
};

export default async function RateHistoryPage() {
  const user = await getSession();
  if (!can(user?.role, "audit:view")) redirect("/dashboard");

  const history = await prisma.rateChangeHistory.findMany({
    orderBy: { changedAt: "desc" },
    take: 200,
    include: { changedBy: { select: { name: true, username: true } } },
  });

  return (
    <>
      <PageHeader title="Rate Change History" description="Complete audit trail of every pricing change." />

      <Card>
        {history.length === 0 ? (
          <EmptyState icon={History} title="No changes yet" description="Rate changes will appear here with who, what and when." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTime(h.changedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TABLE_LABELS[h.tableName] ?? h.tableName}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{h.fieldName ?? "—"}</TableCell>
                  <TableCell>
                    {h.oldValue || h.newValue ? (
                      <span className="flex items-center gap-2 text-sm">
                        {h.oldValue && <span className="text-muted-foreground line-through">{h.oldValue}</span>}
                        {h.oldValue && h.newValue && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                        {h.newValue && <span className="font-medium text-primary">{h.newValue}</span>}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{h.changedBy?.name || h.changedBy?.username || "System"}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{h.reason ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
