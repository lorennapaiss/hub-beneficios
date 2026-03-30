import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Coins,
  CreditCard,
  FileText,
  LayoutDashboard,
  LineChart,
  Network,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { AppUserRole, canAccessAppPath } from "@/lib/user-access";

export type NavItem = {
  title: string;
  href?: string;
  icon?: LucideIcon;
  children?: NavItem[];
};

export const navItems: NavItem[] = [
  {
    title: "Hub",
    href: "/hub",
    icon: Briefcase,
  },
  {
    title: "Controle de Provisórios",
    icon: CreditCard,
    children: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Cartões",
        href: "/cards",
      },
      {
        title: "Cargas",
        href: "/loads",
        icon: Receipt,
      },
      {
        title: "Pessoas",
        href: "/people",
        icon: Users,
      },
    ],
  },
  {
    title: "Pagamentos",
    href: "/beneficios/pagamentos",
    icon: Wallet,
  },
  {
    title: "Coparticipacao",
    href: "/beneficios/coparticipacao",
    icon: Coins,
  },
  {
    title: "Controle de PJs",
    href: "/pjs",
    icon: Network,
  },
  {
    title: "Indicadores",
    href: "/beneficios/indicadores",
    icon: LineChart,
  },
  {
    title: "Faturas",
    icon: FileText,
    children: [
      {
        title: "Análise de Faturas",
        href: "/faturas/analise",
      },
    ],
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
  },
];

export const getNavItemsForRole = (role: AppUserRole) =>
  navItems
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) =>
          child.href ? canAccessAppPath(child.href, role) : false,
        );

        if (children.length === 0) {
          return null;
        }

        return { ...item, children };
      }

      if (item.href && !canAccessAppPath(item.href, role)) {
        return null;
      }

      return item;
    })
    .filter((item): item is NavItem => Boolean(item));

