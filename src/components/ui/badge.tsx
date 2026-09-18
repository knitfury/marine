import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 " +
    "text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        danger: "bg-danger-subtle text-danger-subtle-foreground",
        info: "bg-info-subtle text-info-subtle-foreground",
        outline: "border-border text-foreground",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
