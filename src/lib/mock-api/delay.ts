import { getMockApiState } from "./mock-state";

const DEFAULT_MIN_MS = 300;
const DEFAULT_MAX_MS = 600;
const FORCE_LOADING_EXTRA_MS = 1500;

/**
 * Resolves after a randomized delay, simulating real network latency.
 * Defaults to 300-600ms; pass explicit bounds to override. When the dev-only
 * `forceLoading` mock state is on, an extra fixed delay is added on top so a
 * loading state is easy to see and screenshot.
 */
export function delay(minMs: number = DEFAULT_MIN_MS, maxMs: number = DEFAULT_MAX_MS): Promise<void> {
  const { forceLoading } = getMockApiState();
  const base = minMs + Math.random() * Math.max(0, maxMs - minMs);
  const total = base + (forceLoading ? FORCE_LOADING_EXTRA_MS : 0);
  return new Promise((resolve) => setTimeout(resolve, total));
}
