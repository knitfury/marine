/**
 * MarineLink mock data fixtures.
 * ---------------------------------------------------------------------------
 * Everything under src/data/ is a hand-authored, internally-consistent set
 * of mock fixtures standing in for data that will eventually come from
 * Zoho CRM (and related Zoho apps) once the real backend integration lands.
 * IDs cross-reference each other on purpose (a customer's `dealerId` points
 * at a real dealer, an equipment record's `customerId`/`dealerId` point at
 * real customers/dealers, a service request's `equipmentId` points at real
 * equipment, etc.) so the UI can be built and demoed against realistic,
 * coherent relationships before any live integration exists.
 *
 * Do not hand-edit computed rollup fields (e.g. Dealer.customerCount,
 * Customer.equipmentCount) directly - they're derived in mock-customers.ts
 * / mock-dealers.ts from the underlying equipment/service-request fixtures
 * so they can't drift out of sync.
 */
export * from "./mock-dealers";
export * from "./mock-customers";
export * from "./mock-equipment";
export * from "./mock-service-requests";
export * from "./mock-users";
export * from "./mock-insights";
