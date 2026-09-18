import type { User, UserRole } from "@/types";

/**
 * The three simulated users Phase 1's role switcher cycles through: one
 * internal Marine Travelift staff member, one dealer-side user, and one
 * customer-side user. Each dealer/customer user's `organizationId` matches
 * the corresponding record's id in mock-dealers.ts / mock-customers.ts, so
 * the mock API can scope data to "their org" the same way a real backend
 * would scope by account.
 */
export const mockUsers: User[] = [
  {
    id: "usr-internal-001",
    name: "Elena Marsh",
    email: "elena.marsh@marinetravelift.com",
    role: "internal",
    organizationId: "org-marine-travelift",
    organizationName: "Marine Travelift",
    permissions: [
      "dealers:read",
      "dealers:write",
      "customers:read",
      "customers:write",
      "equipment:read",
      "equipment:write",
      "service-requests:read",
      "service-requests:write",
      "insights:read",
    ],
    dashboardType: "internal",
  },
  {
    id: "usr-dealer-001",
    name: "Karen Whitfield",
    email: "karen.whitfield@greatlakesmarine.com",
    role: "dealer",
    organizationId: "dlr-001",
    organizationName: "Great Lakes Marine Services",
    permissions: [
      "customers:read",
      "customers:write",
      "equipment:read",
      "service-requests:read",
      "service-requests:write",
      "insights:read",
    ],
    dashboardType: "dealer",
  },
  {
    id: "usr-customer-001",
    name: "Lisa Granger",
    email: "lisa.granger@harborviewmarina.com",
    role: "customer",
    organizationId: "cus-001",
    organizationName: "Harborview Marina & Boatyard",
    permissions: ["equipment:read", "service-requests:read", "service-requests:write", "insights:read"],
    dashboardType: "customer",
  },
];

/**
 * Looks up the seeded mock user for a given role. This is the Phase 1
 * stand-in for "who is logged in" - a later phase's auth layer decides the
 * real current user; until then the role switcher (src/stores/role-store.ts)
 * picks one of these three fixtures.
 */
export function getMockUserForRole(role: UserRole): User {
  const user = mockUsers.find((u) => u.role === role);
  if (!user) {
    throw new Error(`No mock user seeded for role "${role}"`);
  }
  return user;
}
