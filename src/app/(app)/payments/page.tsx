import { listPayments, getOutstandingJobs } from "@/lib/services/payments";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PaymentsClient } from "./payments-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payments — Vardhini Borewells" };

export default async function PaymentsPage() {
  const [payments, outstanding, user] = await Promise.all([
    listPayments(),
    getOutstandingJobs(),
    getSession(),
  ]);

  const paymentRows = payments.map((p) => ({
    id: p.id,
    jobId: p.job.id,
    billNumber: p.job.billNumber,
    customer: p.job.customer.customerName,
    amount: Number(p.amount),
    mode: p.paymentMode,
    reference: p.referenceNumber ?? "",
    date: p.paymentDate.toISOString(),
  }));

  const outstandingRows = outstanding.map((j) => ({
    id: j.id,
    billNumber: j.billNumber,
    customer: j.customer.customerName,
    mobile: j.customer.mobile,
    grandTotal: Number(j.grandTotal),
    paid: j.paid,
    balance: j.balance,
    status: j.status,
  }));

  return (
    <PaymentsClient
      payments={paymentRows}
      outstanding={outstandingRows}
      canRecord={can(user?.role, "payments:record")}
    />
  );
}
