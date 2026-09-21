"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export interface BotAvatarProps {
  size?: number;
  className?: string;
}

/**
 * Self-contained inline-SVG "Site Assistant" mascot - a rounded-square body
 * filled with the app's real accent gradient (`--accent` -> `--accent-hover`,
 * Zoho-style blue, read via CSS custom properties so light/dark stay in
 * sync automatically), two round eyes, and a small antenna so it reads as a
 * bot character rather than a generic icon-in-a-circle. The antenna tip and
 * eyes get a gentle Framer Motion "blink" - disabled outright under
 * `prefers-reduced-motion`, same pattern as `useReducedMotion` in
 * service-trend-chart.tsx.
 */
export function BotAvatar({ size = 40, className }: BotAvatarProps) {
  const prefersReducedMotion = useReducedMotion();
  // SVG ids must be unique per document - several BotAvatars can be on
  // screen at once (the launcher button plus one per bot message bubble),
  // so the gradient id can't be a plain string constant.
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Site Assistant avatar"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-hover)" />
        </linearGradient>
      </defs>

      {/* Antenna */}
      <line x1="20" y1="9" x2="20" y2="4" stroke="var(--accent-hover)" strokeWidth="2" strokeLinecap="round" />
      <motion.circle
        cx="20"
        cy="4"
        r="2"
        fill="var(--accent)"
        animate={prefersReducedMotion ? undefined : { scale: [1, 1.25, 1] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }
        }
      />

      {/* Body */}
      <rect x="4" y="9" width="32" height="27" rx="10" fill={`url(#${gradientId})`} />

      {/* Eyes - a subtle blink when motion is allowed */}
      <motion.g
        animate={prefersReducedMotion ? undefined : { scaleY: [1, 1, 0.1, 1] }}
        transition={
          prefersReducedMotion
            ? undefined
            : { duration: 3.6, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut", times: [0, 0.85, 0.92, 1] }
        }
        style={{ transformOrigin: "20px 22px" }}
      >
        <circle cx="14.5" cy="22" r="3" fill="var(--accent-foreground)" />
        <circle cx="25.5" cy="22" r="3" fill="var(--accent-foreground)" />
      </motion.g>

      {/* Smile */}
      <path
        d="M15 28c1.6 1.6 3.4 2.4 5 2.4s3.4-.8 5-2.4"
        stroke="var(--accent-foreground)"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
