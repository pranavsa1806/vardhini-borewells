import {
  LayoutDashboard,
  Users,
  ReceiptText,
  Wallet,
  BarChart3,
  Database,
  Ruler,
  Layers,
  PlusCircle,
  UserCog,
  Settings,
  History,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission; // if set, item only shows when the user has it
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Create Bill", href: "/bills/new", icon: PlusCircle, permission: "bills:create" },
      { label: "Bills", href: "/bills", icon: ReceiptText },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Payments", href: "/payments", icon: Wallet },
      { label: "Reports", href: "/reports", icon: BarChart3, permission: "reports:view" },
    ],
  },
  {
    title: "Master Data",
    items: [
      { label: "Borewell Types", href: "/master/borewell-types", icon: Ruler, permission: "borewellTypes:manage" },
      { label: "Drilling Rate Slabs", href: "/master/drilling-rates", icon: Layers, permission: "rates:manage" },
      { label: "Additional Charges", href: "/master/additional-charges", icon: Database, permission: "charges:manage" },
      { label: "Rate History", href: "/master/rate-history", icon: History, permission: "audit:view" },
      { label: "User Management", href: "/master/users", icon: UserCog, permission: "users:manage" },
      { label: "Settings", href: "/master/settings", icon: Settings, permission: "settings:manage" },
    ],
  },
];
