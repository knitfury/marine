/**
 * The three simulated user roles the shared app shell supports in Phase 1.
 * Each role sees a restricted slice of data (enforced only at the UI/mock
 * layer for now - see src/lib/permissions and src/lib/mock-api).
 */
export type UserRole = "internal" | "dealer" | "customer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  /** Coarse-grained permission strings, e.g. "dealers:read", "service-requests:write". */
  permissions: string[];
  /** Which dashboard layout/summary this user should land on; mirrors `role`. */
  dashboardType: UserRole;
}
