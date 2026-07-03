import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { UsersClient } from "./users-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "User Management — Master Data" };

export default async function UsersPage() {
  const me = await getSession();
  if (!can(me?.role, "users:manage")) redirect("/dashboard");

  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  const rows = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name ?? "",
    role: u.role,
    isActive: u.isActive,
  }));

  return <UsersClient rows={rows} currentUserId={me!.id} />;
}
