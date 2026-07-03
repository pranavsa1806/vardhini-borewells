"use client";
import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { exportToCsv } from "@/lib/export";
import { ReceiptText, PlusCircle, Download } from "lucide-react";

interface Row {
  id: number;
  billNumber: string;
  customer: string;
  mobile: string;
  diameter: string;
  depth: number;
  date: string;
  grandTotal: number;
  paid: number;
  balance: number;
  status: string;
}

export function BillsClient({ rows, canCreate }: { rows: Row[]; canCreate: boolean }) {
  const [status, setStatus] = React.useState<string>("ALL");

  const filtered = React.useMemo(
    () => (status === "ALL" ? rows : rows.filter((r) => r.status === status)),
    [rows, status],
  );

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "billNumber",
        header: "Bill No.",
        cell: ({ row }) => <span className="font-medium text-primary">{row.original.billNumber}</span>,
      },
      {
        accessorKey: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.customer}</p>
            <p className="text-xs text-muted-foreground">{row.original.mobile}</p>
          </div>
        ),
      },
      {
        accessorKey: "depth",
        header: "Job",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.diameter}" · {row.original.depth} ft
          </span>
        ),
      },
      { accessorKey: "date", header: "Date", cell: ({ row }) => formatDate(row.original.date) },
      {
        accessorKey: "grandTotal",
        header: "Total",
        cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.original.grandTotal)}</span>,
      },
      {
        accessorKey: "balance",
        header: "Balance",
        cell: ({ row }) =>
          row.original.balance > 0 ? (
            <span className="tabular-nums text-amber-400">{formatCurrency(row.original.balance)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Bills" description={`${rows.length} bills`}>
        <Button variant="outline" onClick={() => exportToCsv("bills.csv", filtered as unknown as Record<string, unknown>[])}>
          <Download className="h-4 w-4" /> Export
        </Button>
        {canCreate && (
          <Button asChild>
            <Link href="/bills/new">
              <PlusCircle className="h-4 w-4" /> Create Bill
            </Link>
          </Button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search bill no, customer, mobile…"
        rowHref={(r) => `/bills/${r.id}`}
        toolbar={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        }
        emptyState={
          <EmptyState icon={ReceiptText} title="No bills found" description="Adjust filters or create a new bill.">
            {canCreate && (
              <Button className="mt-2" asChild>
                <Link href="/bills/new">
                  <PlusCircle className="h-4 w-4" /> Create Bill
                </Link>
              </Button>
            )}
          </EmptyState>
        }
      />
    </>
  );
}
