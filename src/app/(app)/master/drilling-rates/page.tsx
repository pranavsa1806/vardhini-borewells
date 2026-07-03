import { redirect } from "next/navigation";
import { getAllSlabs, getBorewellTypes } from "@/lib/services/master";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { DrillingRatesClient } from "./drilling-rates-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Drilling Rate Slabs — Master Data" };

export default async function DrillingRatesPage() {
  const user = await getSession();
  if (!can(user?.role, "rates:manage")) redirect("/dashboard");

  const [slabs, types] = await Promise.all([getAllSlabs(), getBorewellTypes()]);

  const rows = slabs.map((s) => ({
    id: s.id,
    borewellTypeId: s.borewellTypeId,
    diameter: s.borewellType.diameterName,
    startDepth: s.startDepth,
    endDepth: s.endDepth,
    pricePerFt: Number(s.pricePerFt),
  }));

  const typeOptions = types.map((t) => ({ id: t.id, diameterName: t.diameterName }));

  return <DrillingRatesClient rows={rows} types={typeOptions} />;
}
