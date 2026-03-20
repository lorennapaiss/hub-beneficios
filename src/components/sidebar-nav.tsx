"use client";

import { useState } from "react";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  variant?: "sidebar" | "sheet";
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
};

const isActivePath = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

const isGroupActive = (
  pathname: string,
  children: { href?: string }[] | undefined,
) => {
  if (!children) return false;
  return children.some((child) =>
    child.href ? isActivePath(pathname, child.href) : false,
  );
};

const linkClasses = (active: boolean, centered = false) =>
  cn(
    "flex items-center gap-3 rounded-xl border border-transparent text-sm font-medium transition-all",
    centered ? "justify-center px-2 py-3" : "px-3 py-2",
    active
      ? "border-sky-500/40 bg-[linear-gradient(90deg,theme(colors.sky.500)/18%,theme(colors.orange.400)/18%)] text-sky-700 shadow-sm"
      : "text-muted-foreground hover:border-primary/20 hover:bg-white/60 hover:text-accent-foreground",
  );

const groupButtonClasses = (active: boolean, centered = false) =>
  cn(
    "flex w-full items-center rounded-xl border border-transparent text-sm font-semibold transition-all",
    centered ? "justify-center px-2 py-3" : "gap-3 px-3 py-2",
    active
      ? "border-sky-500/20 bg-[linear-gradient(90deg,theme(colors.sky.500)/10%,theme(colors.orange.400)/10%)] text-sky-700"
      : "text-foreground/70 hover:border-primary/20 hover:bg-white/60",
  );

export function SidebarNav({
  variant = "sidebar",
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isDesktopSidebar = variant === "sidebar";
  const isCollapsed = isDesktopSidebar && collapsed;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col",
        isDesktopSidebar && "bg-sidebar text-sidebar-foreground",
      )}
    >
      <div
        className={cn(
          "flex gap-3 px-4 py-5 transition-all",
          isCollapsed ? "flex-col items-center px-2" : "items-center",
        )}
      >
        {isDesktopSidebar && onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-white/50 bg-white/70 text-slate-600 transition hover:border-sky-300/70 hover:text-sky-700",
              isCollapsed ? "size-8" : "size-9",
            )}
            aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
            title={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        ) : null}

        <div
          className={cn(
            "flex shrink-0 items-center",
            isCollapsed ? "justify-center" : "min-w-0 flex-1 gap-3",
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,theme(colors.sky.500),theme(colors.orange.400))] text-white shadow-sm">
            HB
          </div>

          {!isCollapsed ? (
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold">Hub Benefícios</div>
              <div className="truncate text-xs text-muted-foreground">
                Portal interno
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <Separator />

      <ScrollArea
        className={cn(
          "flex-1 py-4",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        {!isCollapsed ? (
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Módulos
          </div>
        ) : null}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = item.href ? isActivePath(pathname, item.href) : false;
            const groupActive = isGroupActive(pathname, item.children);
            const Icon = item.icon;

            if (item.children?.length) {
              const isOpen = groupActive
                ? openGroups[item.title] !== false
                : (openGroups[item.title] ?? false);

              if (isCollapsed) {
                return (
                  <div key={item.title} className="group relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((prev) => ({
                          ...prev,
                          [item.title]: !isOpen,
                        }))
                      }
                      className={groupButtonClasses(groupActive, true)}
                      aria-label={item.title}
                      title={item.title}
                    >
                      {Icon ? <Icon className="size-4" aria-hidden /> : null}
                    </button>

                    <div className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-0 z-50 w-64 rounded-2xl border border-white/70 bg-white/95 p-2 opacity-0 shadow-xl shadow-slate-900/10 backdrop-blur transition-all group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100 translate-x-2">
                      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {item.title}
                      </div>
                      <div className="space-y-1">
                        {item.children.map((child) => {
                          if (!child.href) return null;
                          const childActive = isActivePath(pathname, child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              className={linkClasses(childActive)}
                            >
                              <span className="h-2 w-2 rounded-full bg-current/50" />
                              <span className="truncate">{child.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.title} className="space-y-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [item.title]: !isOpen,
                      }))
                    }
                    className={groupButtonClasses(groupActive)}
                    aria-expanded={isOpen}
                  >
                    {Icon ? <Icon className="size-4" aria-hidden /> : null}
                    <span className="flex-1 text-left">{item.title}</span>
                    <ChevronDown
                      className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>

                  {isOpen ? (
                    <div className="space-y-1 pl-7">
                      {item.children.map((child) => {
                        if (!child.href) return null;
                        const childActive = isActivePath(pathname, child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={linkClasses(childActive)}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }

            if (!item.href) return null;

            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={linkClasses(active, isCollapsed)}
                  aria-label={isCollapsed ? item.title : undefined}
                  title={isCollapsed ? item.title : undefined}
                >
                  {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
                  {!isCollapsed ? <span className="truncate">{item.title}</span> : null}
                </Link>

                {isCollapsed ? (
                  <div className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-50 -translate-y-1/2 rounded-xl border border-white/70 bg-white/95 px-3 py-2 text-sm font-medium text-slate-700 opacity-0 shadow-lg shadow-slate-900/10 backdrop-blur transition-all group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100 translate-x-2">
                    {item.title}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {!isCollapsed ? (
        <div className="px-4 pb-5 text-xs text-muted-foreground">
          Hub de processos internos
        </div>
      ) : (
        <div className="px-2 pb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          HB
        </div>
      )}
    </div>
  );
}
