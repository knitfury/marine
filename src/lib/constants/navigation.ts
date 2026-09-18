import type { ElementType } from "react";
import { Gauge, Storefront, Users, Wrench, ClipboardText } from "@phosphor-icons/react";
import { CUSTOMER_SELF_PROFILE_ROUTE, DEALER_SELF_PROFILE_ROUTE } from "@/lib/routes";
import type { UserRole } from "@/types";

/**
 * Per-role primary navigation, per spec section 12. Internal-only routes
 * (full Dealers/Customers directories) only ever appear in `internal`'s
 * list - the Sidebar/MobileNav render straight off `NAV_ITEMS[role]`, so
 * there's no separate "is this route allowed for this role" check to keep
 * in sync.
 *
 * Dealer/customer users get a "My Dealer Profile" / "My Profile" link to a
 * stable self-profile route (`/dealers/me`, `/customers/me`) rather than a
 * hardcoded org id - a later phase implements those routes to resolve to
 * the signed-in user's own org record.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: ElementType;
}

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  internal: [
    { label: "Dashboard", href: "/dashboard", icon: Gauge },
    { label: "Dealers", href: "/dealers", icon: Storefront },
    { label: "Customers", href: "/customers", icon: Users },
    { label: "Equipment", href: "/equipment", icon: Wrench },
    { label: "Service", href: "/service", icon: ClipboardText },
  ],
  dealer: [
    { label: "Dashboard", href: "/dashboard", icon: Gauge },
    { label: "My Dealer Profile", href: DEALER_SELF_PROFILE_ROUTE, icon: Storefront },
    { label: "Equipment", href: "/equipment", icon: Wrench },
    { label: "Service", href: "/service", icon: ClipboardText },
  ],
  customer: [
    { label: "Dashboard", href: "/dashboard", icon: Gauge },
    { label: "My Profile", href: CUSTOMER_SELF_PROFILE_ROUTE, icon: Users },
    { label: "My Equipment", href: "/equipment", icon: Wrench },
    { label: "Service", href: "/service", icon: ClipboardText },
  ],
};

/** The subset of `NAV_ITEMS` shown in the mobile bottom nav (primary 4-5 destinations - same list as desktop here, since every role already has <= 5). */
export function getMobileNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS[role];
}
