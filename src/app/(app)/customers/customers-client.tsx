"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerFormDialog } from "./customer-form-dialog";
import { UserPlus, Users, Eye, Download } from "lucide-react";
import { exportToCsv } from "@/lib/export";

interface Row {
  id: number;
  customerName: string;
  mobile: string;
  village: string;
  district: string;
  jobs: number;
}

export function CustomersClient({ rows, canManage }: { rows: Row[]; canManage: boolean }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const columns = React.useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.customerName}</p>
            <p className="text-xs text-muted-foreground sm:hidden">{row.original.mobile}</p>
          </div>
        ),
      },
      { accessorKey: "mobile", header: "Mobile" },
      {
        accessorKey: "village",
        header: "Location",
        cell: ({ row }) =>
          [row.original.village, row.original.district].filter(Boolean).join(", ") || (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "jobs",
        header: "Bills",
        cell: ({ row }) => <Badge variant="secondary">{row.original.jobs}</Badge>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/customers/${row.original.id}`);
              }}
            >
              <Eye className="h-4 w-4" /> View
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  return (
    <>
      <PageHeader title="Customers" description={`${rows.length} customers`}>
        <Button variant="outline" onClick={() => exportToCsv("customers.csv", rows as unknown as Record<string, unknown>[])}>
          <Download className="h-4 w-4" /> Export
        </Button>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        )}
      </PageHeader>

      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search name, mobile, village…"
        rowHref={(r) => `/customers/${r.id}`}
        emptyState={
          <EmptyState icon={Users} title="No customers" description="Add your first customer to start billing.">
            {canManage && (
              <Button className="mt-2" onClick={() => setDialogOpen(true)}>
                <UserPlus className="h-4 w-4" /> Add Customer
              </Button>
            )}
          </EmptyState>
        }
      />

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
