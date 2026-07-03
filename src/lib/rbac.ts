/**
 * Role-based access control. Central definition of what each role can do so
 * both UI (hiding nav/buttons) and server actions can enforce consistently.
 */
export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "OPERATOR";

export type Permission =
  | "bills:create"
  | "bills:cancel"
  | "customers:manage"
  | "payments:record"
  | "rates:manage"
  | "charges:manage"
  | "borewellTypes:manage"
  | "users:manage"
  | "settings:manage"
  | "reports:view"
  | "audit:view"
  | "backup:manage";

const ALL: Permission[] = [
  "bills:create",
  "bills:cancel",
  "customers:manage",
  "payments:record",
  "rates:manage",
  "charges:manage",
  "borewellTypes:manage",
  "users:manage",
  "settings:manage",
  "reports:view",
  "audit:view",
  "backup:manage",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: [
    "bills:create",
    "bills:cancel",
    "customers:manage",
    "payments:record",
    "rates:manage",
    "charges:manage",
    "borewellTypes:manage",
    "reports:view",
    "audit:view",
    "settings:manage",
  ],
  MANAGER: ["bills:create", "customers:manage", "payments:record", "reports:view"],
  OPERATOR: ["bills:create", "customers:manage"],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  OPERATOR: "Operator",
};
