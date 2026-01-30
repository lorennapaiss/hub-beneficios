"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  variant?: "sidebar" | "sheet";
};

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function SidebarNav({ variant = "sidebar" }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col",
        variant === "sidebar" && "bg-sidebar text-sidebar-foreground",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,theme(colors.sky.500),theme(colors.orange.400))] text-white shadow-sm">
          HB
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Hub Benefícios</div>
          <div className="text-xs text-muted-foreground">Portal interno</div>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Módulos
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-sky-500/40 bg-[linear-gradient(90deg,theme(colors.sky.500)/18%,theme(colors.orange.400)/18%)] text-sky-700 shadow-sm"
                    : "text-muted-foreground hover:border-primary/20 hover:bg-white/60 hover:text-accent-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="px-4 pb-5 text-xs text-muted-foreground">
        Hub de processos internos
      </div>
    </div>
  );
}
