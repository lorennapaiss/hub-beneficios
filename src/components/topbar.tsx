"use client";

import { Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Topbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const userLabel = user?.name ?? user?.email ?? "Usuário";
  const userEmail = user?.email ?? "";
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="relative sticky top-0 z-40 border-b border-white/40 bg-white/70 backdrop-blur after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-gradient-to-r after:from-sky-500 after:via-orange-400 after:to-transparent">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SidebarNav variant="sheet" />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center gap-2">
          <div className="text-sm font-semibold text-foreground sm:text-base">
            Hub Benefícios
          </div>
          <div className="hidden text-sm text-muted-foreground sm:block">
            Operações do time de benefícios
          </div>
          <span className="hidden rounded-full border border-sky-200/70 bg-sky-100/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-700 sm:inline-flex">
            Interno
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">
              {userLabel}
            </div>
            {userEmail ? (
              <div className="text-xs text-muted-foreground">{userEmail}</div>
            ) : null}
          </div>
          <Avatar className="size-8 border border-primary/20">
            <AvatarFallback>
              {user?.name ? initials : <User className="size-4" />}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
