"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "hub-beneficios:sidebar-collapsed";

export function AppShell({ children }: PropsWithChildren) {
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
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside
          className={cn(
            "hidden border-r border-white/40 bg-sidebar/80 backdrop-blur transition-[width] duration-300 ease-out lg:flex",
            desktopCollapsed ? "w-20" : "w-72",
          )}
        >
          <SidebarNav
            variant="sidebar"
            collapsed={desktopCollapsed}
            onToggleCollapsed={() => setDesktopCollapsed((current) => !current)}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out">
          <Topbar
            mobileNavOpen={mobileNavOpen}
            onMobileNavOpenChange={setMobileNavOpen}
          />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[calc(100vw-2rem)]">
              <div className="glass-card rounded-3xl p-4 sm:p-6">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
