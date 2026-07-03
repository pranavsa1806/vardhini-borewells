"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets } from "lucide-react";
import { NAV_SECTIONS } from "./nav-config";
import { can, type Role } from "@/lib/rbac";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: Role;
  onNavigate?: () => void;
}

export function SidebarNav({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Droplets className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Vardhini</p>
          <p className="text-xs text-muted-foreground">Borewells</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV_SECTIONS.map((section, i) => {
          const items = section.items.filter((item) => !item.permission || can(role, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={i} className="space-y-1">
              {section.title && (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              )}
              {items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href) && item.href !== "/bills") ||
                  (item.href === "/bills" && pathname === "/bills");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">v1.0 · Billing System</p>
      </div>
    </div>
  );
}
