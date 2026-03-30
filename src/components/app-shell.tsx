"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import { AppUserRole } from "@/lib/user-access";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "hub-beneficios:sidebar-collapsed";

type AppShellProps = PropsWithChildren<{
  role?: AppUserRole;
}>;

export function AppShell({ children, role = "BENEFITS_ASSISTANT" }: AppShellProps) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    try {
      return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(desktopCollapsed));
    } catch {}
  }, [desktopCollapsed]);

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate-100/70 to-transparent" />
      </div>

      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:flex",
            desktopCollapsed ? "w-20" : "w-72"
          )}
        >
          <SidebarNav
            variant="sidebar"
            collapsed={desktopCollapsed}
            role={role}
            onToggleCollapsed={() => setDesktopCollapsed((current) => !current)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out">
          <Topbar
            mobileNavOpen={mobileNavOpen}
            role={role}
            onMobileNavOpenChange={setMobileNavOpen}
          />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1600px]">
              <div className="app-shell-panel min-h-[calc(100vh-8.75rem)] p-4 sm:p-6 lg:p-7">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
