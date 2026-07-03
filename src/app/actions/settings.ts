"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { settingsSchema } from "@/lib/validators";
import { authorize, run, type ActionResult } from "./guard";

export async function updateSettings(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("settings:manage");
    const data = settingsSchema.parse(input);
    const existing = await prisma.companySetting.findFirst();
    const payload = {
      companyName: data.companyName,
      address: data.address || null,
      gstNumber: data.gstNumber || null,
      contactNumber: data.contactNumber || null,
      email: data.email || null,
      footerText: data.footerText || null,
      currency: data.currency,
      gstEnabled: data.gstEnabled,
      defaultTaxRate: data.defaultTaxRate,
      billPrefix: data.billPrefix,
    };
    if (existing) {
      await prisma.companySetting.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.companySetting.create({ data: payload });
    }
    revalidatePath("/master/settings");
    revalidatePath("/dashboard");
  });
}
