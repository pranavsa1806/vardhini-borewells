import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "@/lib/services/customers";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CustomerActions } from "./customer-actions";
import { ReceiptText, IndianRupee, Wallet, MapPin, Phone, ArrowLeft, PlusCircle, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(Number(id));
  if (!customer) notFound();

  const user = await getSession();
  const canManage = can(user?.role, "customers:manage");

  const activeJobs = customer.jobs.filter((j) => j.status !== "CANCELLED");
  const totalBilled = activeJobs.reduce((s, j) => s + Number(j.grandTotal), 0);
  const totalPaid = activeJobs.reduce(
    (s, j) => s + j.payments.reduce((ps, p) => ps + Number(p.amount), 0),
    0,
  );
  const balance = totalBilled - totalPaid;

  const location = [customer.village, customer.taluk, customer.district, customer.state]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" /> Customers
          </Link>
        </Button>
      </div>

      <PageHeader title={customer.customerName} description={`Customer since ${formatDate(customer.createdAt)}`}>
        {canManage && (
          <CustomerActions
            customer={{
              id: customer.id,
              customerName: customer.customerName,
              mobile: customer.mobile,
              vehicleNumber: customer.vehicleNumber,
              address: customer.address,
              village: customer.village,
              taluk: customer.taluk,
              district: customer.district,
              state: customer.state,
            }}
            hasJobs={customer.jobs.length > 0}
          />
        )}
        <Button asChild>
          <Link href={`/bills/new?customerId=${customer.id}`}>
            <PlusCircle className="h-4 w-4" /> New Bill
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.mobile}</span>
            </div>
            {customer.vehicleNumber && (
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono uppercase">{customer.vehicleNumber}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <span>{[customer.address, location].filter(Boolean).join(", ") || "No address on file"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
          <StatCard label="Total Bills" value={activeJobs.length} icon={ReceiptText} accent="blue" />
          <StatCard label="Total Billed" value={formatCurrency(totalBilled)} icon={IndianRupee} accent="primary" />
          <StatCard label="Balance Due" value={formatCurrency(balance)} icon={Wallet} accent={balance > 0 ? "amber" : "primary"} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.jobs.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No bills yet" description="This customer has no bills.">
              <Button className="mt-2" asChild>
                <Link href={`/bills/new?customerId=${customer.id}`}>
                  <PlusCircle className="h-4 w-4" /> Create Bill
                </Link>
              </Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.jobs.map((j) => (
                  <TableRow key={j.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/bills/${j.id}`} className="font-medium text-primary hover:underline">
                        {j.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{formatDate(j.drillingDate)}</TableCell>
                    <TableCell>{j.borewellType.diameterName}"</TableCell>
                    <TableCell>{j.totalDepth} ft</TableCell>
                    <TableCell>
                      <StatusBadge status={j.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(j.grandTotal))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
