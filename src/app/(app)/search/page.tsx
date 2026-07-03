import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search as SearchIcon, ReceiptText, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search — Vardhini Borewells" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const [bills, customers] = query
    ? await Promise.all([
        prisma.borewellJob.findMany({
          where: {
            OR: [
              { billNumber: { contains: query, mode: "insensitive" } },
              { customer: { customerName: { contains: query, mode: "insensitive" } } },
              { customer: { mobile: { contains: query } } },
            ],
          },
          include: { customer: { select: { customerName: true } } },
          take: 20,
          orderBy: { createdAt: "desc" },
        }),
        prisma.customer.findMany({
          where: {
            OR: [
              { customerName: { contains: query, mode: "insensitive" } },
              { mobile: { contains: query } },
            ],
          },
          take: 20,
          orderBy: { customerName: "asc" },
        }),
      ])
    : [[], []];

  const hasResults = bills.length > 0 || customers.length > 0;

  return (
    <>
      <PageHeader title="Search" description={query ? `Results for “${query}”` : "Search bills, customers and mobile numbers."} />

      {!query ? (
        <EmptyState icon={SearchIcon} title="Start typing" description="Use the search bar to find bills or customers." />
      ) : !hasResults ? (
        <EmptyState icon={SearchIcon} title="No results" description={`Nothing matched “${query}”.`} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ReceiptText className="h-4 w-4 text-primary" /> Bills ({bills.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {bills.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No bills found.</p>
              ) : (
                bills.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bills/${b.id}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.customer.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.billNumber} · {formatDate(b.drillingDate)}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                    <span className="text-sm font-semibold">{formatCurrency(Number(b.grandTotal))}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" /> Customers ({customers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {customers.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No customers found.</p>
              ) : (
                customers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/customers/${c.id}`}
                    className="flex items-center justify-between rounded-md px-2 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="text-sm font-medium">{c.customerName}</span>
                    <span className="text-sm text-muted-foreground">{c.mobile}</span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
