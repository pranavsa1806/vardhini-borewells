import "server-only";
import { requireUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/rbac";
import type { SessionUser } from "@/lib/auth";

/** Ensure the current user has a permission; throws if not. Returns the user. */
export async function authorize(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** Wrap an action body, converting thrown errors into a friendly result. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    if (msg === "UNAUTHORIZED") return { ok: false, error: "Please sign in again." };
    if (msg === "FORBIDDEN") return { ok: false, error: "You don't have permission to do that." };
    return { ok: false, error: msg };
  }
}
