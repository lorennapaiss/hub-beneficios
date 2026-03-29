"use client";

import { useState } from "react";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const isGroupActive = (pathname: string, children: { href?: string }[] | undefined) => {
  if (!children) return false;
  return children.some((child) =>
    child.href ? isActivePath(pathname, child.href) : false
  );
};

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
  const linkClasses = (active: boolean, centered = false) =>
    cn(
      "flex items-center gap-3 rounded-2xl border text-sm font-medium transition-all duration-200",
      centered ? "justify-center px-2 py-3" : "px-3 py-2.5",
      isDesktopSidebar
        ? active
          ? "border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white"
        : active
          ? "border-border/80 bg-slate-100 text-slate-950"
          : "border-transparent text-slate-600 hover:border-border/70 hover:bg-slate-100 hover:text-slate-950"
    );
  const groupButtonClasses = (active: boolean, centered = false) =>
    cn(
      "flex w-full items-center rounded-2xl border text-sm font-semibold transition-all duration-200",
      centered ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
      isDesktopSidebar
        ? active
          ? "border-white/10 bg-white/10 text-white"
          : "border-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white"
        : active
          ? "border-border/80 bg-slate-100 text-slate-950"
          : "border-transparent text-slate-600 hover:border-border/70 hover:bg-slate-100 hover:text-slate-950"
    );

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col",
        isDesktopSidebar
          ? "bg-sidebar text-sidebar-foreground"
          : "bg-white text-foreground"
      )}
    >
      <div
        className={cn(
          "flex gap-3 border-b px-4 py-6 transition-all",
          isDesktopSidebar ? "border-white/6" : "border-border/70",
          isCollapsed ? "flex-col items-center px-2" : "items-center"
        )}
      >
        {isDesktopSidebar && onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "inline-flex items-center justify-center rounded-xl border transition",
              isDesktopSidebar
                ? "border-white/10 bg-white/6 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"
                : "border-border/70 bg-background text-foreground hover:bg-muted",
              isCollapsed ? "size-8" : "size-9"
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
            isCollapsed ? "justify-center" : "min-w-0 flex-1 gap-3"
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4DBFB3] to-[#0C3B6F] font-semibold text-white shadow-sm">
            HB
          </div>

          {!isCollapsed ? (
            <div className="min-w-0 flex-1 leading-tight">
              <div
                className={cn(
                  "truncate text-sm font-semibold",
                  isDesktopSidebar ? "text-white" : "text-foreground"
                )}
              >
                Hub Benefícios
              </div>
              <div
                className={cn(
                  "truncate text-xs",
                  isDesktopSidebar ? "text-slate-400" : "text-muted-foreground"
                )}
              >
                Portal interno
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ScrollArea className={cn("flex-1 py-4", isCollapsed ? "px-2" : "px-3")}>
        {!isCollapsed ? (
          <div
            className={cn(
              "px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em]",
              isDesktopSidebar ? "text-slate-500" : "text-muted-foreground"
            )}
          >
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

                    <div className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-0 z-50 w-64 translate-x-2 rounded-2xl border border-border/70 bg-white/96 p-2 opacity-0 shadow-xl shadow-slate-900/10 backdrop-blur transition-all group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
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
                              className={cn(
                                "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-950",
                                childActive &&
                                  "border-border/70 bg-slate-100 text-slate-950"
                              )}
                            >
                              <span className="h-2 w-2 rounded-full bg-current/45" />
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
                      className={cn(
                        "size-4 transition-transform",
                        isOpen && "rotate-180"
                      )}
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
                  <div className="pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-50 -translate-y-1/2 translate-x-2 rounded-xl border border-border/70 bg-white/96 px-3 py-2 text-sm font-medium text-slate-700 opacity-0 shadow-lg shadow-slate-900/10 backdrop-blur transition-all group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-x-0 group-focus-within:opacity-100">
                    {item.title}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {!isCollapsed ? (
        <div
          className={cn(
            "px-4 pb-5 text-xs",
            isDesktopSidebar ? "text-slate-500" : "text-muted-foreground"
          )}
        >
          Hub de processos internos
        </div>
      ) : (
        <div className="px-2 pb-5 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          HB
        </div>
      )}
    </div>
  );
}
