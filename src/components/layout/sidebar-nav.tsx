"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/components/layout/nav-config";

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  groups,
  collapsed = false,
  onNavigate,
}: {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {groups.map((group, i) => (
        <div key={group.label || i} className={cn("px-2", i > 0 && "mt-4")}>
          {group.label && !collapsed && (
            <p className="category-label px-2.5 pb-1.5 text-muted-foreground">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const link = (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    "min-h-[40px]",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-4 w-4 shrink-0 items-center justify-center",
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                    {active && (
                      <span className="absolute -left-[13px] top-1/2 h-4 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-pill" />
                    )}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );

              if (!collapsed) {
                return <li key={item.href}>{link}</li>;
              }

              return (
                <li key={item.href}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
