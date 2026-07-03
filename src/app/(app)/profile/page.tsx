import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/app/actions/auth";
import { ROLE_LABELS, can, type Permission } from "@/lib/rbac";
import { initials } from "@/lib/utils";
import { LogOut, ShieldCheck, KeyRound } from "lucide-react";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile — Vardhini Borewells" };

const PERMISSION_LABELS: Record<Permission, string> = {
  "bills:create": "Create bills",
  "bills:cancel": "Cancel bills",
  "customers:manage": "Manage customers",
  "payments:record": "Record payments",
  "rates:manage": "Manage drilling rates",
  "charges:manage": "Manage additional charges",
  "borewellTypes:manage": "Manage borewell types",
  "users:manage": "Manage users",
  "settings:manage": "Manage settings",
  "reports:view": "View reports",
  "audit:view": "View audit trail",
  "backup:manage": "Backup & restore",
};

export default async function ProfilePage() {
  const user = await getSession();
  if (!user) redirect("/login");

  const display = user.name || user.username;
  const perms = (Object.keys(PERMISSION_LABELS) as Permission[]).filter((p) => can(user.role, p));

  return (
    <>
      <PageHeader title="Profile" description="Your account and access level." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {initials(display)}
            </span>
            <div>
              <p className="text-lg font-semibold">{display}</p>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
            </div>
            <Badge>{ROLE_LABELS[user.role]}</Badge>
            <form action={logoutAction} className="w-full pt-2">
              <Button variant="outline" className="w-full text-red-400" type="submit">
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" /> Your Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {perms.map((p) => (
                <div key={p} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  {PERMISSION_LABELS[p]}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
