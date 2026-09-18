/**
 * Dev-only mock-state controls.
 * ---------------------------------------------------------------------------
 * A simple in-memory, module-level switchboard that every function in
 * src/lib/mock-api/index.ts consults before doing its normal work. This
 * lets a later phase build a small dev UI control (e.g. a corner panel)
 * that flips these flags to preview loading/empty/error UI states without
 * needing a real backend to misbehave on command.
 *
 * State is process/module-local (not persisted, not synced across tabs) -
 * that's intentional for a dev tool. It resets on every reload.
 */

export interface MockApiState {
  /** When true, every mock-api call adds extra artificial latency. */
  forceLoading: boolean;
  /** When true, every mock-api list call resolves to an empty array. */
  forceEmpty: boolean;
  /** When true, every mock-api call rejects with a simulated network error. */
  forceError: boolean;
}

const state: MockApiState = {
  forceLoading: false,
  forceEmpty: false,
  forceError: false,
};

export function getMockApiState(): Readonly<MockApiState> {
  return state;
}

export function setMockApiState(partial: Partial<MockApiState>): void {
  Object.assign(state, partial);
}

export function resetMockApiState(): void {
  state.forceLoading = false;
  state.forceEmpty = false;
  state.forceError = false;
}

/**
 * Error thrown when `forceError` is enabled, so consuming UI can
 * distinguish "simulated failure" from a genuine bug via `instanceof`.
 */
export class SimulatedNetworkError extends Error {
  constructor(message = "Simulated network error (mock-api forceError is on)") {
    super(message);
    this.name = "SimulatedNetworkError";
  }
}
