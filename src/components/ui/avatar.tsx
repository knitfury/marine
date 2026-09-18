"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Full display name, used to derive initials when no image is shown. */
  name: string;
  /** Optional avatar image URL. Falls back to initials if missing or if it fails to load. */
  src?: string;
  size?: "sm" | "default" | "lg";
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-7 w-7 text-xs",
  default: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, name, src, size = "default", ...props }, ref) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const showImage = Boolean(src) && !imageFailed;

    return (
      <span
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          "bg-secondary font-medium text-secondary-foreground select-none",
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- small avatar, mock data URLs, no need for next/image optimization here
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-hidden="true">{initialsFromName(name)}</span>
        )}
        <span className="sr-only">{name}</span>
      </span>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
