import { listBills, paidAmount } from "@/lib/services/bills";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BillsClient } from "./bills-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bills — Vardhini Borewells" };

export default async function BillsPage() {
  const [bills, user] = await Promise.all([listBills(), getSession()]);
  const rows = bills.map((b) => {
    const paid = paidAmount(b.payments);
    return {
      id: b.id,
      billNumber: b.billNumber,
      customer: b.customer.customerName,
      mobile: b.customer.mobile,
      diameter: b.borewellType.diameterName,
      depth: b.totalDepth,
      date: b.drillingDate.toISOString(),
      grandTotal: Number(b.grandTotal),
      paid,
      balance: Number(b.grandTotal) - paid,
      status: b.status,
    };
  });

  return <BillsClient rows={rows} canCreate={can(user?.role, "bills:create")} />;
}
