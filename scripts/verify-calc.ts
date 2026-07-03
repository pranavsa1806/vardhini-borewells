import { PrismaClient } from "@prisma/client";
import { calculateDrilling } from "../src/lib/calc";

const prisma = new PrismaClient();

async function main() {
  const type = await prisma.borewellType.findFirst({ where: { diameterName: "4.75" } });
  if (!type) throw new Error("4.75 type not found");
  const slabs = await prisma.drillingRateSlab.findMany({
    where: { borewellTypeId: type.id },
    orderBy: { startDepth: "asc" },
  });

  const result = calculateDrilling(
    400,
    slabs.map((s) => ({ id: s.id, startDepth: s.startDepth, endDepth: s.endDepth, pricePerFt: Number(s.pricePerFt) })),
  );

  console.log("4.75\" @ 400 ft breakdown:");
  for (const r of result.rows) console.log(`  ${r.label} ft x ₹${r.ratePerFt} = ₹${r.amount}`);
  console.log(`  TOTAL = ₹${result.total}  (expected ₹44000)`);
  console.log(result.total === 44000 ? "  ✅ PASS" : "  ❌ FAIL");

  // Edge: exceeding deepest slab (600) at 650
  const over = calculateDrilling(
    650,
    slabs.map((s) => ({ id: s.id, startDepth: s.startDepth, endDepth: s.endDepth, pricePerFt: Number(s.pricePerFt) })),
  );
  console.log(`\n4.75" @ 650 ft: total ₹${over.total}, exceedsSlabs=${over.exceedsSlabs}, uncovered=${over.uncoveredFeet} (expected 50)`);
}

main().finally(() => prisma.$disconnect());
