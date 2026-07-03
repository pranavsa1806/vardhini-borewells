import "server-only";
import { prisma } from "@/lib/prisma";

export async function getCompanySettings() {
  const s = await prisma.companySetting.findFirst();
  return (
    s ?? {
      id: 0,
      companyName: "Vardhini Borewells",
      logoUrl: null,
      address: null,
      gstNumber: null,
      contactNumber: null,
      email: null,
      footerText: "Thank you for your business!",
      currency: "INR",
      gstEnabled: false,
      defaultTaxRate: 0 as unknown as never,
      billPrefix: "VB",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  );
}
