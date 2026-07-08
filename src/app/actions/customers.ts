"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";
import { searchCustomers } from "@/lib/services/customers";
import { requireUser } from "@/lib/auth";
import { authorize, run, type ActionResult } from "./guard";

/** Autocomplete search for the bill customer picker. */
export async function searchCustomersAction(query: string) {
  await requireUser();
  return searchCustomers(query, 8);
}

/** Fetch one customer (lite) — used to auto-select after inline creation. */
export async function getCustomerLiteAction(id: number) {
  await requireUser();
  return prisma.customer.findUnique({
    where: { id },
    select: { id: true, customerName: true, mobile: true, village: true },
  });
}

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: number }>> {
  return run(async () => {
    await authorize("customers:manage");
    const data = customerSchema.parse(input);
    const c = await prisma.customer.create({
      data: {
        customerName: data.customerName,
        mobile: data.mobile,
        vehicleNumber: data.vehicleNumber ? data.vehicleNumber.toUpperCase().trim() : null,
        address: data.address || null,
        village: data.village || null,
        taluk: data.taluk || null,
        district: data.district || null,
        state: data.state || null,
      },
    });
    revalidatePath("/customers");
    return { id: c.id };
  });
}

export async function updateCustomer(id: number, input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("customers:manage");
    const data = customerSchema.parse(input);
    await prisma.customer.update({
      where: { id },
      data: {
        customerName: data.customerName,
        mobile: data.mobile,
        vehicleNumber: data.vehicleNumber ? data.vehicleNumber.toUpperCase().trim() : null,
        address: data.address || null,
        village: data.village || null,
        taluk: data.taluk || null,
        district: data.district || null,
        state: data.state || null,
      },
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
  });
}

export async function deleteCustomer(id: number): Promise<ActionResult> {
  return run(async () => {
    await authorize("customers:manage");
    const jobs = await prisma.borewellJob.count({ where: { customerId: id } });
    if (jobs > 0) throw new Error("Cannot delete a customer with existing bills.");
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
  });
}
