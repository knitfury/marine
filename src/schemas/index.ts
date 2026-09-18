/**
 * Zod schemas mirroring src/types/*. These validate mock "API responses" in
 * src/lib/mock-api today, standing in for response validation against a
 * real backend later.
 */
export * from "./user";
export * from "./dealer";
export * from "./customer";
export * from "./equipment";
export * from "./service-request";
export * from "./dashboard-insight";
export * from "./dashboard-summary";
