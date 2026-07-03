/**
 * Seed script — inserts all master data exactly as specified:
 *  - borewell types (4.75", 6.5", 8")
 *  - drilling rate slabs for each type
 *  - additional charge types + per-type rates
 *  - a default super-admin user and company settings
 *
 * Rerunnable: uses upserts / clears pricing tables first.
 */
import { PrismaClient, ChargeUnit } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Drilling slabs keyed by diameter name.
const DRILLING_SLABS: Record<string, [number, number, number][]> = {
  "4.75": [
    [1, 200, 100],
    [201, 300, 110],
    [301, 400, 130],
    [401, 500, 170],
    [501, 550, 220],
    [551, 600, 300],
  ],
  "6.5": [
    [1, 300, 110],
    [301, 400, 120],
    [401, 500, 140],
    [501, 600, 170],
    [601, 700, 210],
    [701, 800, 260],
    [801, 900, 320],
    [901, 1000, 390],
  ],
  "8": [
    [1, 200, 150],
    [201, 300, 170],
    [301, 400, 200],
    [401, 500, 240],
    [501, 600, 340],
  ],
};

// Additional charge types.
const CHARGE_TYPES = [
  { name: '5 inch PVC', description: '5 inch PVC casing pipe' },
  { name: '7 inch PVC', description: '7 inch PVC casing pipe' },
  { name: '10 inch PVC', description: '10 inch PVC casing pipe' },
  { name: 'Transport', description: 'Machine transport charge' },
  { name: 'Old Bore Cleaning', description: 'Cleaning of existing borewell' },
  { name: 'Extra Machine', description: 'Additional machine deployment' },
  { name: 'Blasting', description: 'Rock blasting per hole' },
];

// Rates: [chargeName, diameterName, price, unit]
const CHARGE_RATES: [string, string, number, ChargeUnit][] = [
  // 4.75"
  ['5 inch PVC', '4.75', 270, ChargeUnit.PER_FT],
  ['7 inch PVC', '4.75', 320, ChargeUnit.PER_FT],
  ['Transport', '4.75', 1500, ChargeUnit.FIXED],
  ['Old Bore Cleaning', '4.75', 60, ChargeUnit.PER_FT],
  ['Extra Machine', '4.75', 5000, ChargeUnit.PER_DAY],
  ['Blasting', '4.75', 2000, ChargeUnit.PER_HOLE],
  // 6.5"
  ['7 inch PVC', '6.5', 320, ChargeUnit.PER_FT],
  ['10 inch PVC', '6.5', 700, ChargeUnit.PER_FT],
  ['Transport', '6.5', 1500, ChargeUnit.FIXED],
  ['Old Bore Cleaning', '6.5', 70, ChargeUnit.PER_FT],
  ['Extra Machine', '6.5', 8000, ChargeUnit.PER_DAY],
  // 8"
  ['10 inch PVC', '8', 700, ChargeUnit.PER_FT],
  ['Transport', '8', 2000, ChargeUnit.FIXED],
];

async function main() {
  console.log("🌱 Seeding borewellbills...");

  // --- Borewell types ---
  const typeByName: Record<string, number> = {};
  for (const diameter of Object.keys(DRILLING_SLABS)) {
    const t = await prisma.borewellType.upsert({
      where: { id: await getTypeId(diameter) },
      update: {},
      create: { diameterName: diameter },
    });
    typeByName[diameter] = t.id;
  }

  // --- Drilling slabs (clear + reinsert) ---
  for (const [diameter, slabs] of Object.entries(DRILLING_SLABS)) {
    const typeId = typeByName[diameter];
    await prisma.drillingRateSlab.deleteMany({ where: { borewellTypeId: typeId } });
    await prisma.drillingRateSlab.createMany({
      data: slabs.map(([startDepth, endDepth, pricePerFt]) => ({
        borewellTypeId: typeId,
        startDepth,
        endDepth,
        pricePerFt,
      })),
    });
  }
  console.log(`  ✓ borewell types + drilling slabs`);

  // --- Additional charge types ---
  const chargeTypeByName: Record<string, number> = {};
  for (const ct of CHARGE_TYPES) {
    const existing = await prisma.additionalChargeType.findFirst({ where: { name: ct.name } });
    const rec = existing
      ? await prisma.additionalChargeType.update({ where: { id: existing.id }, data: ct })
      : await prisma.additionalChargeType.create({ data: ct });
    chargeTypeByName[ct.name] = rec.id;
  }

  // --- Additional charge rates ---
  for (const [chargeName, diameter, price, unit] of CHARGE_RATES) {
    const chargeTypeId = chargeTypeByName[chargeName];
    const borewellTypeId = typeByName[diameter];
    await prisma.additionalChargeRate.upsert({
      where: { additionalChargeTypeId_borewellTypeId: { additionalChargeTypeId: chargeTypeId, borewellTypeId } },
      update: { price, unit },
      create: { additionalChargeTypeId: chargeTypeId, borewellTypeId, price, unit },
    });
  }
  console.log(`  ✓ additional charges`);

  // --- Default users ---
  // In production, set ADMIN_PASSWORD (and optionally MANAGER_PASSWORD /
  // OPERATOR_PASSWORD) before seeding so no weak default is ever created.
  const users = [
    { username: 'admin', name: 'Super Admin', role: 'SUPER_ADMIN' as const, password: process.env.ADMIN_PASSWORD || 'admin123' },
    { username: 'manager', name: 'Branch Manager', role: 'MANAGER' as const, password: process.env.MANAGER_PASSWORD || 'manager123' },
    { username: 'operator', name: 'Field Operator', role: 'OPERATOR' as const, password: process.env.OPERATOR_PASSWORD || 'operator123' },
  ];
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: u.role, name: u.name },
      create: { username: u.username, name: u.name, role: u.role, passwordHash },
    });
  }
  console.log(`  ✓ users (admin/admin123, manager/manager123, operator/operator123)`);

  // --- Company settings ---
  const existingSetting = await prisma.companySetting.findFirst();
  if (!existingSetting) {
    await prisma.companySetting.create({
      data: {
        companyName: 'Vardhini Borewells',
        address: 'Main Road, Karnataka, India',
        contactNumber: '+91 98800 00000',
        email: 'info@vardhiniborewells.com',
        footerText: 'Thank you for your business!',
        billPrefix: 'VB',
      },
    });
  }
  console.log(`  ✓ company settings`);

  console.log("✅ Seed complete.");
}

// Helper: find an existing borewell type id for upsert, or return 0 (no match).
async function getTypeId(diameter: string): Promise<number> {
  const existing = await prisma.borewellType.findFirst({ where: { diameterName: diameter } });
  return existing?.id ?? 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
