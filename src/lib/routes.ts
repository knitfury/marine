/**
 * Central place for entity detail-route URL building, so shared components
 * (AttentionCard, RelatedRecordCard, EntityCard/*Card wrappers...) never
 * hand-roll a `/dealers/${id}` string inline. Detail screens themselves are
 * built in a later phase, but the URL shape is decided here so nav links,
 * dashboard insights and directory cards all agree on it up front.
 */

import type { DashboardInsightEntityType } from "@/types";

export type EntityRouteKind = DashboardInsightEntityType;

const ENTITY_ROUTE_PREFIX: Record<EntityRouteKind, string> = {
  dealer: "/dealers",
  customer: "/customers",
  equipment: "/equipment",
  service: "/service",
};

/** Builds a detail-page href for a given entity kind + id, e.g. entityHref("dealer", "dlr-001") -> "/dealers/dlr-001". */
export function entityHref(kind: EntityRouteKind, id: string): string {
  return `${ENTITY_ROUTE_PREFIX[kind]}/${id}`;
}

export const DEALER_SELF_PROFILE_ROUTE = "/dealers/me";
export const CUSTOMER_SELF_PROFILE_ROUTE = "/customers/me";
