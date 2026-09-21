"use client";

import * as React from "react";
import { LockSimple } from "@phosphor-icons/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export interface ConfirmableActionPlaceholderProps extends Omit<ButtonProps, "onClick"> {
  /** Text shown on the disabled-looking trigger, e.g. "Close request". */
  label: string;
  /** Overrides the default explanation copy in the dialog. */
  message?: string;
}

const DEFAULT_MESSAGE =
  "This action isn't available yet — it will be enabled once MarineLink connects to real service workflows.";

/**
 * Stand-in for create/edit/close/etc. actions that are explicitly out of
 * scope for Phase 1. Looks like a disabled action but is actually a normal
 * button that opens an explanatory dialog on click, so it's discoverable
 * rather than a dead, unexplained disabled control.
 */
export function ConfirmableActionPlaceholder({
  label,
  message = DEFAULT_MESSAGE,
  variant = "outline",
  ...buttonProps
}: ConfirmableActionPlaceholderProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={variant}
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
        {...buttonProps}
      >
        <LockSimple className="size-4" aria-hidden="true" />
        {label}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Not available yet</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
