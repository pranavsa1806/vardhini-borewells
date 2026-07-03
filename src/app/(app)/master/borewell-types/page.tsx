import { redirect } from "next/navigation";
import { getBorewellTypesWithUsage } from "@/lib/services/master";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { BorewellTypesClient } from "./borewell-types-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Borewell Types — Master Data" };

export default async function BorewellTypesPage() {
  const user = await getSession();
  if (!can(user?.role, "borewellTypes:manage")) redirect("/dashboard");

  const types = await getBorewellTypesWithUsage();
  const rows = types.map((t) => ({
    id: t.id,
    diameterName: t.diameterName,
    isActive: t.isActive,
    slabs: t._count.drillingRateSlabs,
    jobs: t._count.borewellJobs,
  }));

  return <BorewellTypesClient rows={rows} />;
}
