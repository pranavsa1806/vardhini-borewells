/**
 * Drilling calculation engine — the core of the system.
 *
 * All pricing is read from the database (drilling_rate_slabs). Given a total
 * depth, it splits the depth across the applicable slabs and prices each
 * segment separately. Nothing here is hardcoded, so changing a slab rate in
 * Master Data instantly changes every future bill.
 */

export interface Slab {
  id?: number;
  startDepth: number;
  endDepth: number;
  pricePerFt: number;
}

export interface DrillingBreakdownRow {
  slabId?: number;
  fromDepth: number;
  toDepth: number;
  feet: number;
  ratePerFt: number;
  amount: number;
  label: string; // e.g. "1-200"
}

export interface DrillingResult {
  rows: DrillingBreakdownRow[];
  totalFeet: number;
  total: number;
  /** True if the entered depth exceeds the deepest configured slab. */
  exceedsSlabs: boolean;
  uncoveredFeet: number;
}

/**
 * Split `totalDepth` (in feet) across `slabs` and compute the cost per segment.
 *
 * Example — 4.75" to 400 ft with slabs [1-200 @100, 201-300 @110, 301-400 @130]:
 *   1-200   -> 200 ft x 100 = 20000
 *   201-300 -> 100 ft x 110 = 11000
 *   301-400 -> 100 ft x 130 = 13000
 *   total = 44000
 */
export function calculateDrilling(totalDepth: number, slabs: Slab[]): DrillingResult {
  const rows: DrillingBreakdownRow[] = [];

  if (!totalDepth || totalDepth <= 0 || slabs.length === 0) {
    return { rows, totalFeet: 0, total: 0, exceedsSlabs: false, uncoveredFeet: 0 };
  }

  // Sort ascending by start depth so segments come out in order.
  const ordered = [...slabs].sort((a, b) => a.startDepth - b.startDepth);

  let total = 0;
  let totalFeet = 0;
  let deepestCovered = 0;

  for (const slab of ordered) {
    if (totalDepth < slab.startDepth) break; // nothing reaches this slab

    // Overlap between [slab.startDepth, slab.endDepth] and [1, totalDepth].
    const segFrom = slab.startDepth;
    const segTo = Math.min(slab.endDepth, totalDepth);
    const feet = segTo - segFrom + 1; // inclusive depths, e.g. 1..200 = 200 ft

    if (feet <= 0) continue;

    const rate = Number(slab.pricePerFt);
    const amount = round2(feet * rate);

    rows.push({
      slabId: slab.id,
      fromDepth: segFrom,
      toDepth: segTo,
      feet,
      ratePerFt: rate,
      amount,
      label: `${segFrom}-${segTo}`,
    });

    total = round2(total + amount);
    totalFeet += feet;
    deepestCovered = Math.max(deepestCovered, slab.endDepth);
  }

  const uncoveredFeet = Math.max(0, totalDepth - deepestCovered);

  return {
    rows,
    totalFeet,
    total,
    exceedsSlabs: uncoveredFeet > 0,
    uncoveredFeet,
  };
}

/** Charge unit as stored in the DB. */
export type ChargeUnit = "PER_FT" | "PER_DAY" | "PER_HOLE" | "FIXED";

export interface AdditionalChargeInput {
  price: number;
  unit: ChargeUnit;
  quantity: number; // feet / days / holes; ignored for FIXED
}

/**
 * Compute a single additional charge. FIXED charges ignore quantity.
 * e.g. 5" PVC @270/ft x 80 ft = 21600; Transport (FIXED) = 1500.
 */
export function calculateAdditionalCharge({ price, unit, quantity }: AdditionalChargeInput): number {
  const p = Number(price);
  if (unit === "FIXED") return round2(p);
  const qty = Number(quantity) || 0;
  return round2(p * qty);
}

/** Human label for a charge unit. */
export function unitLabel(unit: ChargeUnit): string {
  switch (unit) {
    case "PER_FT":
      return "per ft";
    case "PER_DAY":
      return "per day";
    case "PER_HOLE":
      return "per hole";
    case "FIXED":
      return "fixed";
  }
}

/** Whether a charge needs a quantity input from the user. */
export function needsQuantity(unit: ChargeUnit): boolean {
  return unit !== "FIXED";
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface BillTotalsInput {
  drillingTotal: number;
  additionalTotal: number;
  discount: number;
  taxRate?: number; // percentage; 0 when GST disabled
}

export interface BillTotals {
  subtotal: number;
  discount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

/** Roll up the bill: subtotal - discount, then optional tax. */
export function calculateBillTotals({
  drillingTotal,
  additionalTotal,
  discount,
  taxRate = 0,
}: BillTotalsInput): BillTotals {
  const subtotal = round2(drillingTotal + additionalTotal);
  const disc = round2(Math.min(discount || 0, subtotal));
  const taxableAmount = round2(subtotal - disc);
  const taxAmount = round2((taxableAmount * (taxRate || 0)) / 100);
  const grandTotal = round2(taxableAmount + taxAmount);
  return { subtotal, discount: disc, taxableAmount, taxAmount, grandTotal };
}
