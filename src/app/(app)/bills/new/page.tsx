import { redirect } from "next/navigation";
import { getBillFormData } from "@/lib/services/bill-form";
import { getBillById } from "@/lib/services/bills";
import { searchCustomers, getCustomerById } from "@/lib/services/customers";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BillWizard } from "./bill-wizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create Bill — Vardhini Borewells" };

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; duplicate?: string }>;
}) {
  const user = await getSession();
  if (!can(user?.role, "bills:create")) redirect("/dashboard");

  const { customerId, duplicate } = await searchParams;
  const [formData, recentCustomers] = await Promise.all([getBillFormData(), searchCustomers("", 8)]);

  let preselected = null;
  let initial = null;

  // Duplicate an existing bill's inputs into a fresh draft.
  if (duplicate) {
    const src = await getBillById(Number(duplicate));
    if (src) {
      preselected = {
        id: src.customer.id,
        customerName: src.customer.customerName,
        mobile: src.customer.mobile,
        village: src.customer.village,
      };
      initial = {
        borewellTypeId: src.borewellTypeId,
        totalDepth: src.totalDepth,
        waterLevel: src.waterLevel,
        remarks: src.remarks,
        discount: Number(src.discount),
      };
    }
  } else if (customerId) {
    const c = await getCustomerById(Number(customerId));
    if (c) preselected = { id: c.id, customerName: c.customerName, mobile: c.mobile, village: c.village };
  }

  return (
    <BillWizard
      formData={formData}
      recentCustomers={recentCustomers}
      preselectedCustomer={preselected}
      initial={initial}
    />
  );
}
