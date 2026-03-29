"use client";

import { Menu, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { SidebarNav } from "@/components/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type TopbarProps = {
  mobileNavOpen: boolean;
  onMobileNavOpenChange: (open: boolean) => void;
};

export function Topbar({ mobileNavOpen, onMobileNavOpenChange }: TopbarProps) {
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1600px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet open={mobileNavOpen} onOpenChange={onMobileNavOpenChange}>
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
            <SidebarNav variant="sheet" onNavigate={() => onMobileNavOpenChange(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground sm:text-base">
              Hub Benefícios
            </div>
            <div className="hidden text-sm text-muted-foreground xl:block">
              Operações do time de benefícios
            </div>
          </div>
          <span className="hidden rounded-full border border-[#4DBFB3]/30 bg-[#4DBFB3]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0C3B6F] sm:inline-flex">
            Operação interna
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-foreground">{userLabel}</div>
            {userEmail ? (
              <div className="text-xs text-muted-foreground">{userEmail}</div>
            ) : null}
          </div>
          <Avatar className="size-9 border border-border/80 bg-card">
            <AvatarFallback className="bg-transparent text-foreground">
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
