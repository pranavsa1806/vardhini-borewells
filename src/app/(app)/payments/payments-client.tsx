"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { PaymentDialog } from "@/components/shared/payment-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Wallet, Receipt } from "lucide-react";

interface PaymentRow {
  id: number;
  jobId: number;
  billNumber: string;
  customer: string;
  amount: number;
  mode: string;
  reference: string;
  date: string;
}
interface OutstandingRow {
  id: number;
  billNumber: string;
  customer: string;
  mobile: string;
  grandTotal: number;
  paid: number;
  balance: number;
  status: string;
}

const MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank",
  CHEQUE: "Cheque",
  CARD: "Card",
};

export function PaymentsClient({
  payments,
  outstanding,
  canRecord,
}: {
  payments: PaymentRow[];
  outstanding: OutstandingRow[];
  canRecord: boolean;
}) {
  const router = useRouter();
  const [payTarget, setPayTarget] = React.useState<OutstandingRow | null>(null);

  const totalOutstanding = outstanding.reduce((s, o) => s + o.balance, 0);
  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <>
      <PageHeader title="Payments" description="Track collections and outstanding balances." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(totalCollected)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{formatCurrency(totalOutstanding)}</p>
        </Card>
      </div>

      <Tabs defaultValue="outstanding">
        <TabsList>
          <TabsTrigger value="outstanding">Outstanding ({outstanding.length})</TabsTrigger>
          <TabsTrigger value="history">Payment History ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding">
          <Card>
            {outstanding.length === 0 ? (
              <EmptyState icon={Wallet} title="All settled" description="No outstanding balances. Great!" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstanding.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link href={`/bills/${o.id}`} className="font-medium text-primary hover:underline">
                          {o.billNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{o.customer}</p>
                        <p className="text-xs text-muted-foreground">{o.mobile}</p>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatCurrency(o.grandTotal)}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">{formatCurrency(o.paid)}</TableCell>
                      <TableCell className="font-semibold tabular-nums text-amber-400">{formatCurrency(o.balance)}</TableCell>
                      <TableCell className="text-right">
                        {canRecord && (
                          <Button size="sm" onClick={() => setPayTarget(o)}>
                            <Wallet className="h-4 w-4" /> Record
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            {payments.length === 0 ? (
              <EmptyState icon={Receipt} title="No payments yet" description="Recorded payments will appear here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatDate(p.date)}</TableCell>
                      <TableCell>
                        <Link href={`/bills/${p.jobId}`} className="font-medium text-primary">
                          {p.billNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{p.customer}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{MODE_LABELS[p.mode] ?? p.mode}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.reference || "—"}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {payTarget && (
        <PaymentDialog
          open={!!payTarget}
          onOpenChange={(o) => !o && setPayTarget(null)}
          jobId={payTarget.id}
          billNumber={payTarget.billNumber}
          balance={payTarget.balance}
          onDone={() => {
            setPayTarget(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
