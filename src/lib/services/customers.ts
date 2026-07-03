import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function listCustomers(search?: string) {
  const where: Prisma.CustomerWhereInput = search
    ? {
        OR: [
          { customerName: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search } },
          { village: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  return prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { jobs: true } } },
  });
}

/** Lightweight list for the bill customer picker / autocomplete. */
export async function searchCustomers(search: string, take = 8) {
  return prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { customerName: { contains: search, mode: "insensitive" } },
            { mobile: { contains: search } },
          ],
        }
      : {},
    orderBy: { customerName: "asc" },
    take,
    select: { id: true, customerName: true, mobile: true, village: true },
  });
}

export async function getCustomerById(id: number) {
  return prisma.customer.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          borewellType: { select: { diameterName: true } },
          payments: { select: { amount: true } },
        },
      },
    },
  });
}
