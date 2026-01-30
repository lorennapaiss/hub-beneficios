import type { LucideIcon } from "lucide-react";
import {
  Gift,
  Briefcase,
  CreditCard,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  {
    title: "Hub",
    href: "/hub",
    icon: Briefcase,
  },
  {
    title: "Benefícios",
    href: "/beneficios",
    icon: Gift,
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Cartões",
    href: "/cards",
    icon: CreditCard,
  },
  {
    title: "Cargas",
    href: "/loads",
    icon: Receipt,
  },
  {
    title: "Pagamentos",
    href: "/beneficios/pagamentos",
    icon: Wallet,
  },
  {
    title: "Pessoas",
    href: "/people",
    icon: Users,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
  },
];
