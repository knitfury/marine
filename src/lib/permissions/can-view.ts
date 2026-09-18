/**
 * UI-modeling permission helpers.
 * ---------------------------------------------------------------------------
 * IMPORTANT: these are pure functions a later UI phase can call to decide
 * what to *render* (e.g. hide a "Dealers" nav link from a customer user).
 * They are NOT real security enforcement - Phase 1 has no backend, no real
 * auth, and nothing stops a determined user from bypassing client-side
 * checks. Real authorization must be enforced server-side once MarineLink
 * is wired up to its Zoho-backed backend; until then, treat every function
 * here as a convenience for consistent UI behavior only.
 */

import type { Customer, Dealer, Equipment, ServiceRequest, User } from "@/types";

/**
 * Internal staff can view any dealer. A dealer user can view their own
 * dealer org (matching the access every other canView* helper grants an
 * org to its own users) but not other dealers. A customer user cannot view
 * any dealer record directly.
 */
export function canViewDealer(user: User, dealer: Dealer): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return dealer.id === user.organizationId;
  return false;
}

/**
 * Internal staff can view any customer. A dealer user can view customers
 * that belong to their own dealer org. A customer user can only view their
 * own org's record.
 */
export function canViewCustomer(user: User, customer: Customer): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return customer.dealerId === user.organizationId;
  return customer.id === user.organizationId;
}

/**
 * Internal staff can view any equipment record. A dealer user can view
 * equipment tied to their dealer org. A customer user can only view
 * equipment tied to their own org.
 */
export function canViewEquipment(user: User, equipment: Equipment): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return equipment.dealerId === user.organizationId;
  return equipment.customerId === user.organizationId;
}

/**
 * Internal staff can view any service request. A dealer user can view
 * requests tied to their dealer org. A customer user can only view
 * requests tied to their own org.
 */
export function canViewServiceRequest(user: User, request: ServiceRequest): boolean {
  if (user.role === "internal") return true;
  if (user.role === "dealer") return request.dealerId === user.organizationId;
  return request.customerId === user.organizationId;
}

/** Coarse permission-string check against `user.permissions`. */
export function hasPermission(user: User, permission: string): boolean {
  return user.permissions.includes(permission);
}
