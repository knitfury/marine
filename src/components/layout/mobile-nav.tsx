"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMobileNavItems } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export interface MobileNavProps {
  role: UserRole;
}

/** Bottom navigation bar for the primary destinations - the mobile nav pattern per spec, fixed to the viewport bottom, safe-area aware, `lg:hidden`. */
export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = getMobileNavItems(role);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="flex items-stretch justify-around">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] font-medium",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}
              >
                <Icon className="size-5" weight={isActive ? "fill" : "regular"} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
