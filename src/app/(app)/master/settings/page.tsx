import { redirect } from "next/navigation";
import { getCompanySettings } from "@/lib/services/settings";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings — Master Data" };

export default async function SettingsPage() {
  const user = await getSession();
  if (!can(user?.role, "settings:manage")) redirect("/dashboard");

  const s = await getCompanySettings();
  return (
    <SettingsClient
      initial={{
        companyName: s.companyName,
        address: s.address ?? "",
        gstNumber: s.gstNumber ?? "",
        contactNumber: s.contactNumber ?? "",
        email: s.email ?? "",
        footerText: s.footerText ?? "",
        currency: s.currency,
        gstEnabled: s.gstEnabled,
        defaultTaxRate: Number(s.defaultTaxRate),
        billPrefix: s.billPrefix,
      }}
    />
  );
}
