"use client";

/**
 * Minimal toast state/queue, in the shape of shadcn's well-known
 * `use-toast` pattern: a module-level store with a small subscriber list,
 * so any component can call `toast({...})` (even outside React, e.g. a
 * mock-api error handler) and every mounted `useToast()`/`<Toaster />`
 * re-renders. No provider component is required, but the shell still
 * mounts a single `<Toaster />` to actually render the live queue.
 */

import * as React from "react";

export type ToastVariant = "default" | "success" | "warning" | "danger" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Defaults to 5000; pass 0 to disable. */
  duration?: number;
}

export interface ToastRecord extends ToastOptions {
  id: string;
}

const TOAST_LIMIT = 4;
const DEFAULT_DURATION = 5000;

let toasts: ToastRecord[] = [];
const listeners = new Set<(toasts: ToastRecord[]) => void>();
const timeouts = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

function dismiss(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  const existing = timeouts.get(id);
  if (existing) {
    clearTimeout(existing);
    timeouts.delete(id);
  }
  emit();
}

function toast(options: ToastOptions): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: ToastRecord = { id, ...options };
  toasts = [record, ...toasts].slice(0, TOAST_LIMIT);
  emit();

  const duration = options.duration ?? DEFAULT_DURATION;
  if (duration > 0) {
    timeouts.set(
      id,
      setTimeout(() => dismiss(id), duration)
    );
  }
  return id;
}

function useToast() {
  const [state, setState] = React.useState<ToastRecord[]>(toasts);

  React.useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return { toasts: state, toast, dismiss };
}

export { useToast, toast, dismiss };
