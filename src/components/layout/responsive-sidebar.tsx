"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, CaretLineLeft, CaretLineRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUiPreferencesStore } from "@/stores/ui-preferences-store";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export interface ResponsiveSidebarProps {
  role: UserRole;
}

/** Desktop-only (hidden below `lg:`) collapsible nav rail, role-aware and active-route highlighted. */
export function ResponsiveSidebar({ role }: ResponsiveSidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useUiPreferencesStore();
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
        sidebarCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Anchor className="size-5 shrink-0 text-accent" aria-hidden="true" />
        {!sidebarCollapsed && <span className="truncate text-sm font-semibold text-foreground">MarineLink</span>}
      </div>

      <nav className="flex-1 overflow-y-auto p-3" aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const link = (
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            return (
              <li key={item.href}>
                {sidebarCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn("w-full gap-2 text-muted-foreground", sidebarCollapsed && "justify-center px-0")}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <CaretLineRight className="size-4" aria-hidden="true" />
          ) : (
            <>
              <CaretLineLeft className="size-4" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
