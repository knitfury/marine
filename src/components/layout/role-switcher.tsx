"use client";

import { usePathname, useRouter } from "next/navigation";
import { CaretDown, IdentificationBadge } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoleStore } from "@/stores/role-store";
import { ROLE_LABELS, USER_ROLES } from "@/lib/constants/roles";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export interface RoleSwitcherProps {
  className?: string;
}

/**
 * Role switcher (Phase 1 has no real auth - see spec 5.4/24), letting
 * whoever's signed in preview the app as internal staff, a dealer, or a
 * customer. Switching roles navigates to `/dashboard` if the person isn't
 * already there, since a role's other routes (e.g. a dealer's own profile)
 * may not make sense for the newly selected role.
 */
export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { role, setRole } = useRoleStore();
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(next: UserRole) {
    setRole(next);
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-input bg-surface px-2.5 py-1.5 text-sm font-medium text-foreground",
              "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <IdentificationBadge className="size-4 text-muted-foreground" aria-hidden="true" />
            {/* sr-only below sm (not `hidden`) so the button keeps an accessible name - matching the visible label at sm+ - even when icon-only on mobile. */}
            <span className="sr-only sm:not-sr-only sm:inline">{ROLE_LABELS[role]}</span>
            <CaretDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>View as</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {USER_ROLES.map((r) => (
            <DropdownMenuItem key={r} onSelect={() => handleSelect(r)}>
              {ROLE_LABELS[r]}
              {r === role && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
