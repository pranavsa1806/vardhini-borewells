import { redirect } from "next/navigation";
import { getAllChargeRates, getChargeTypes, getBorewellTypes } from "@/lib/services/master";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { AdditionalChargesClient } from "./additional-charges-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Additional Charges — Master Data" };

export default async function AdditionalChargesPage() {
  const user = await getSession();
  if (!can(user?.role, "charges:manage")) redirect("/dashboard");

  const [rates, chargeTypes, borewellTypes] = await Promise.all([
    getAllChargeRates(),
    getChargeTypes(),
    getBorewellTypes(),
  ]);

  const rows = rates.map((r) => ({
    id: r.id,
    chargeName: r.chargeType.name,
    additionalChargeTypeId: r.additionalChargeTypeId,
    borewellTypeId: r.borewellTypeId,
    diameter: r.borewellType.diameterName,
    unit: r.unit as "PER_FT" | "PER_DAY" | "PER_HOLE" | "FIXED",
    price: Number(r.price),
    isActive: r.isActive,
  }));

  return (
    <AdditionalChargesClient
      rows={rows}
      chargeTypes={chargeTypes.map((c) => ({ id: c.id, name: c.name }))}
      borewellTypes={borewellTypes.map((b) => ({ id: b.id, diameterName: b.diameterName }))}
    />
  );
}
