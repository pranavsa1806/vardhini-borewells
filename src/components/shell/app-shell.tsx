"use client";
import * as React from "react";
import { SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Role } from "@/lib/rbac";

interface AppShellProps {
  user: { name: string | null; username: string; role: Role };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Restore saved theme preference.
  React.useEffect(() => {
    try {
      if (localStorage.getItem("theme") === "light") document.documentElement.classList.add("light");
    } catch {}
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
        <div className="sticky top-0 h-screen">
          <SidebarNav role={user.role} />
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-64 translate-x-0 translate-y-0 rounded-none border-y-0 border-l-0 p-0 [&>button]:hidden data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left">
          <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
        </DialogContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
