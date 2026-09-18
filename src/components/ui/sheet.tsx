"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetPortal = DialogPrimitive.Portal;
const SheetClose = DialogPrimitive.Close;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-navy-950/50 backdrop-blur-[2px]",
      "data-[state=open]:animate-[overlay-show_180ms_ease-out]",
      "data-[state=closed]:animate-[overlay-hide_150ms_ease-in]",
      className
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * `side="right"` (the desktop default) slides in from the right edge.
 * `side="bottom"` slides up from the bottom - the pattern used on mobile
 * (e.g. `<Sheet><SheetContent side="bottom" className="sm:hidden">`,
 * pairing with a `side="right" className="hidden sm:block"` variant, is the
 * usual way to get "right on desktop, bottom on mobile" out of one Sheet).
 */
const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 border-border bg-surface-raised shadow-xl focus:outline-none",
  {
    variants: {
      side: {
        right:
          "inset-y-0 right-0 h-full w-full max-w-sm border-l p-6 " +
          "data-[state=open]:animate-[slide-in-from-right_220ms_ease-out] " +
          "data-[state=closed]:animate-[slide-out-to-right_180ms_ease-in]",
        bottom:
          "inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-xl border-t p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] " +
          "data-[state=open]:animate-[slide-in-from-bottom_220ms_ease-out] " +
          "data-[state=closed]:animate-[slide-out-to-bottom_180ms_ease-in]",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  hideCloseButton?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, hideCloseButton, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), "overflow-y-auto", className)}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close
          className={cn(
            "absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 pr-6 text-left", className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetPortal,
  SheetClose,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
