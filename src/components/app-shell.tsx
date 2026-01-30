import type { PropsWithChildren } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative min-h-screen text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-orange-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen">
        <aside className="hidden w-64 border-r border-white/40 bg-sidebar/80 backdrop-blur lg:flex">
          <SidebarNav variant="sidebar" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
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
