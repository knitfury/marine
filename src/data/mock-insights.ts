import type { DashboardInsight } from "@/types";

/**
 * Dashboard insight fixtures spanning all three role scenarios (internal,
 * dealer, customer) and all four entity types. `relatedDealerId` /
 * `relatedCustomerId` let src/lib/mock-api/index.ts scope insights to a
 * dealer or customer user's own org; insights with neither are treated as
 * internal/company-wide.
 */
export const mockInsights: DashboardInsight[] = [
  {
    id: "ins-001",
    title: "Urgent service request open past initial SLA",
    description:
      "SR-100231 (hydraulic pressure loss on port lift cylinder) at Harborview Marina & Boatyard has been open for 5 days without resolution.",
    severity: "critical",
    entityType: "service",
    entityId: "svc-001",
    actionLabel: "Review request",
    relatedDealerId: "dlr-001",
    relatedCustomerId: "cus-001",
  },
  {
    id: "ins-002",
    title: "Dealer application pending review",
    description:
      "Carolina Marine Equipment Co.'s dealer application has been in pending status for over 3 weeks and is awaiting network review.",
    severity: "attention",
    entityType: "dealer",
    entityId: "dlr-005",
    actionLabel: "Review application",
  },
  {
    id: "ins-003",
    title: "Dealer inactive for an extended period",
    description:
      "Chesapeake Bay Marine Solutions has had no service or equipment activity recorded in over 60 days.",
    severity: "attention",
    entityType: "dealer",
    entityId: "dlr-006",
    actionLabel: "Contact dealer",
    relatedDealerId: "dlr-006",
  },
  {
    id: "ins-004",
    title: "Retired unit awaiting decommissioning decision",
    description:
      "The Outer Banks 50-Ton Travelift was marked retired but has no replacement order or salvage plan recorded yet.",
    severity: "info",
    entityType: "equipment",
    entityId: "eqp-012",
    actionLabel: "View equipment",
    relatedDealerId: "dlr-005",
    relatedCustomerId: "cus-009",
  },
  {
    id: "ins-005",
    title: "Load-test certification overdue",
    description:
      "The Cape Anchor 220-Ton Travelift is due for its annual load-test certification; no inspection has been scheduled.",
    severity: "critical",
    entityType: "equipment",
    entityId: "eqp-009",
    actionLabel: "Schedule inspection",
    relatedDealerId: "dlr-004",
    relatedCustomerId: "cus-007",
  },
  {
    id: "ins-006",
    title: "Hydraulic pressure loss reported on active lift",
    description:
      "A port lift cylinder pressure loss was reported during a haul-out. A technician has been dispatched and is actively diagnosing.",
    severity: "critical",
    entityType: "service",
    entityId: "svc-001",
    actionLabel: "View request",
    relatedDealerId: "dlr-001",
    relatedCustomerId: "cus-001",
  },
  {
    id: "ins-007",
    title: "Sling wear exceeds tolerance",
    description:
      "Belt slings 2 and 3 on the Puget Harbor 75-Ton Travelift were found worn beyond tolerance during a routine inspection.",
    severity: "attention",
    entityType: "service",
    entityId: "svc-007",
    actionLabel: "View request",
    relatedDealerId: "dlr-003",
    relatedCustomerId: "cus-006",
  },
  {
    id: "ins-008",
    title: "Annual certification due this month",
    description:
      "The Emerald Sound 100-Ton Travelift's annual load-test certification is due and coordination with yard operations is in progress.",
    severity: "attention",
    entityType: "service",
    entityId: "svc-006",
    actionLabel: "View request",
    relatedDealerId: "dlr-003",
    relatedCustomerId: "cus-005",
  },
  {
    id: "ins-009",
    title: "Lift capacity upgrade opportunity",
    description:
      "Lakeshore Yacht Basin requested a consultation on upgrading to a higher-capacity hoist ahead of next season.",
    severity: "info",
    entityType: "service",
    entityId: "svc-013",
    actionLabel: "View request",
    relatedDealerId: "dlr-001",
    relatedCustomerId: "cus-011",
  },
  {
    id: "ins-010",
    title: "Top-performing dealer this quarter",
    description:
      "Great Lakes Marine Services leads the dealer network in resolved service requests and customer equipment uptime this quarter.",
    severity: "info",
    entityType: "dealer",
    entityId: "dlr-001",
    actionLabel: "View dealer",
    relatedDealerId: "dlr-001",
  },
  {
    id: "ins-011",
    title: "Hydraulic pump failure caused unplanned downtime",
    description:
      "The Cortez Gulf 150-Ton Travelift went offline mid-lift after a main hydraulic pump failure; a replacement pump is being installed.",
    severity: "critical",
    entityType: "equipment",
    entityId: "eqp-015",
    actionLabel: "View equipment",
    relatedDealerId: "dlr-002",
    relatedCustomerId: "cus-012",
  },
  {
    id: "ins-012",
    title: "Prospect nearing conversion",
    description:
      "Puget Harbor Marine Center has an active equipment inspection underway and may be ready to convert from prospect to active status.",
    severity: "info",
    entityType: "customer",
    entityId: "cus-006",
    actionLabel: "View customer",
    relatedDealerId: "dlr-003",
    relatedCustomerId: "cus-006",
  },
];
