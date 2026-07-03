/**
 * Audit-trail helper. Records pricing changes into rate_change_history so
 * management can see who changed what, when, and why.
 */
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export interface RateChangeEntry {
  tableName: string;
  recordId: number;
  fieldName?: string;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  changedById?: number | null;
  reason?: string | null;
}

/** Log one or more field changes. Accepts an optional transaction client. */
export async function logRateChange(
  entries: RateChangeEntry | RateChangeEntry[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  const list = Array.isArray(entries) ? entries : [entries];
  await client.rateChangeHistory.createMany({
    data: list.map((e) => ({
      tableName: e.tableName,
      recordId: e.recordId,
      fieldName: e.fieldName ?? null,
      oldValue: e.oldValue != null ? String(e.oldValue) : null,
      newValue: e.newValue != null ? String(e.newValue) : null,
      changedById: e.changedById ?? null,
      reason: e.reason ?? null,
    })),
  });
}
