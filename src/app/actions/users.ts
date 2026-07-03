"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { authorize, run, type ActionResult } from "./guard";

export async function createUser(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("users:manage");
    const data = userSchema.parse(input);
    if (!data.password) throw new Error("Password is required for a new user.");
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) throw new Error("Username already exists.");
    await prisma.user.create({
      data: {
        username: data.username,
        name: data.name || null,
        role: data.role,
        isActive: data.isActive,
        passwordHash: await hashPassword(data.password),
      },
    });
    revalidatePath("/master/users");
  });
}

export async function updateUser(id: number, input: unknown): Promise<ActionResult> {
  return run(async () => {
    await authorize("users:manage");
    const data = userSchema.parse(input);
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name || null,
        role: data.role,
        isActive: data.isActive,
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      },
    });
    revalidatePath("/master/users");
  });
}

export async function deleteUser(id: number): Promise<ActionResult> {
  return run(async () => {
    const me = await authorize("users:manage");
    if (me.id === id) throw new Error("You can't delete your own account.");
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/master/users");
  });
}
