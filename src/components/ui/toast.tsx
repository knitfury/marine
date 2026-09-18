"use client";

/**
 * Toast primitive. Deliberately hand-built (no @radix-ui/react-toast) - a
 * fixed, stacked region of self-dismissing cards is simple enough not to
 * need a dependency, and it keeps the same "copy the source" shadcn style
 * as everything else in src/components/ui. State/queueing lives in
 * src/hooks/use-toast.ts; this file is just the visual primitive plus the
 * <Toaster /> that renders the live queue.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle, Warning, XCircle, Info, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const toastVariants = cva(
  "pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-raised text-foreground",
        success: "border-success/30 bg-success-subtle text-success-subtle-foreground",
        warning: "border-warning/30 bg-warning-subtle text-warning-subtle-foreground",
        danger: "border-danger/30 bg-danger-subtle text-danger-subtle-foreground",
        info: "border-info/30 bg-info-subtle text-info-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const ICONS: Record<NonNullable<VariantProps<typeof toastVariants>["variant"]>, React.ElementType> = {
  default: Info,
  success: CheckCircle,
  warning: Warning,
  danger: XCircle,
  info: Info,
};

export interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  title?: string;
  description?: string;
}

function Toast({ id, title, description, variant = "default" }: ToastProps) {
  const { dismiss } = useToast();
  const Icon = ICONS[variant ?? "default"];

  return (
    <div role="status" className={cn(toastVariants({ variant }))}>
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && <p className="mt-0.5 text-sm opacity-90">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => dismiss(id)}
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" aria-hidden="true" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}

function Toaster() {
  const { toasts } = useToast();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:w-full sm:max-w-sm"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}

export { Toast, Toaster, toastVariants };
