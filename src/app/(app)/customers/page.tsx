import { listCustomers } from "@/lib/services/customers";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { CustomersClient } from "./customers-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers — Vardhini Borewells" };

export default async function CustomersPage() {
  const [customers, user] = await Promise.all([listCustomers(), getSession()]);
  const canManage = can(user?.role, "customers:manage");

  const rows = customers.map((c) => ({
    id: c.id,
    customerName: c.customerName,
    mobile: c.mobile,
    village: c.village ?? "",
    district: c.district ?? "",
    jobs: c._count.jobs,
  }));

  return <CustomersClient rows={rows} canManage={canManage} />;
}
