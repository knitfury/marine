"use client";

import { SignOut } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EntityAvatar } from "@/components/shared/entity-avatar";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { User } from "@/types";

export interface UserMenuProps {
  user: User | undefined;
  isLoading?: boolean;
}

/**
 * Avatar + name/org dropdown. "Sign out" is intentionally a no-op (Phase 1
 * has no real auth/session to end) - it logs to the console rather than
 * pretending to succeed, so it's never mistaken for a working control.
 */
export function UserMenu({ user, isLoading }: UserMenuProps) {
  if (isLoading || !user) {
    return <div className="size-9 animate-pulse rounded-full bg-muted" aria-hidden="true" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`Account menu for ${user.name}`}
        >
          <EntityAvatar name={user.name} imageUrl={user.avatarUrl} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">{user.name}</span>
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <p>
            Role: <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
          </p>
          <p>
            Org: <span className="font-medium text-foreground">{user.organizationName}</span>
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          onSelect={(e) => {
            e.preventDefault();
            // Phase 1 has no real auth/session; this is a deliberate no-op, not a bug.
            console.log("Sign out is not implemented in the Phase 1 demo.");
          }}
        >
          <SignOut className="size-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
