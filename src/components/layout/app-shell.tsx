"use client";

import * as React from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu, type SessionUser } from "@/components/layout/user-menu";
import { appNavGroups, adminNavGroups } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

export function AppShell({
  variant,
  user,
  children,
}: {
  variant: "app" | "admin";
  user: SessionUser;
  children: React.ReactNode;
}) {
  // Resolved here (client-side) rather than passed in as a prop — nav items
  // carry raw lucide-react icon component references, which aren't valid
  // Server → Client Component props (only plain serializable data is).
  const navGroups = variant === "admin" ? adminNavGroups : appNavGroups;
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Logo showWordmark={!collapsed} />
        </div>
        <SidebarNav groups={navGroups} collapsed={collapsed} />
        <div className="border-t border-sidebar-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </Button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-72 flex-col bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-16 items-center border-b border-sidebar-border px-4">
            <Logo />
          </div>
          <SidebarNav groups={navGroups} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <GlobalSearch className="hidden h-9 flex-1 max-w-md justify-start gap-2 text-muted-foreground font-normal sm:flex" />
          <div className="ml-auto flex items-center gap-1.5">
            <GlobalSearch
              iconOnly
              className="flex h-9 w-9 items-center justify-center p-0 text-muted-foreground sm:hidden"
            />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
