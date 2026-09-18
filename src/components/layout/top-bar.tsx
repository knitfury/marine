"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, MagnifyingGlass, Bell } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import type { User, UserRole } from "@/types";

export interface TopBarProps {
  role: UserRole;
  user: User | undefined;
  isUserLoading?: boolean;
}

function useCurrentSectionLabel(role: UserRole): string {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const match = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return match?.label ?? "Dashboard";
}

function GlobalSearchTrigger() {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <MagnifyingGlass className="size-4" aria-hidden="true" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Global search is coming soon.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Search dealers, customers, equipment..." disabled />
      </DialogContent>
    </Dialog>
  );
}

function NotificationsTrigger() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <p className="px-2 py-4 text-center text-sm text-muted-foreground">No new notifications</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Sticky top bar: brand (mobile) / page context (desktop) on the left, utility actions on the right. */
export function TopBar({ role, user, isUserLoading }: TopBarProps) {
  const sectionLabel = useCurrentSectionLabel(role);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sm:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <Anchor className="size-5 text-accent" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">MarineLink</span>
      </Link>

      <span className="hidden text-sm font-medium text-muted-foreground lg:inline">{sectionLabel}</span>

      <div className="ml-auto flex items-center gap-1">
        <GlobalSearchTrigger />
        <NotificationsTrigger />
        <RoleSwitcher />
        <ThemeToggle />
        <UserMenu user={user} isLoading={isUserLoading} />
      </div>
    </header>
  );
}
