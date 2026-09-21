"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/providers";
import type { StatusTone } from "@/lib/formatting/status";

/**
 * Chart mark colors, resolved from the app's own design tokens
 * (src/app/globals.css) rather than a parallel hardcoded palette. Recharts
 * marks are SVG fills that need a concrete color string, so this hook reads
 * the *computed* CSS custom property values off `<html>` at render time and
 * re-reads them whenever `useTheme()`'s theme flips - the same
 * read-computed-styles seam every other themed, canvas/SVG-driven piece of
 * this app would need, since `var(--token)` can't be handed to every
 * Recharts color prop directly.
 *
 * Tone colors (success/warning/danger/info/neutral) intentionally reuse the
 * exact tokens StatusBadge/PriorityBadge already render with (see
 * src/lib/formatting/status.ts) so chart color never contradicts a badge
 * shown elsewhere for the same status/priority.
 */
export interface ChartColorTokens {
  success: string;
  warning: string;
  danger: string;
  info: string;
  neutral: string;
  accent: string;
  border: string;
  mutedForeground: string;
  foreground: string;
  surface: string;
}

const TOKEN_VARS = {
  success: "--success",
  warning: "--warning",
  danger: "--danger",
  info: "--info",
  neutral: "--muted-foreground",
  accent: "--accent",
  border: "--border",
  mutedForeground: "--muted-foreground",
  foreground: "--foreground",
  surface: "--surface",
} as const satisfies Record<keyof ChartColorTokens, string>;

function readTokens(): ChartColorTokens {
  if (typeof document === "undefined") {
    return {
      success: "",
      warning: "",
      danger: "",
      info: "",
      neutral: "",
      accent: "",
      border: "",
      mutedForeground: "",
      foreground: "",
      surface: "",
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const read = (cssVar: string) => styles.getPropertyValue(cssVar).trim();

  return {
    success: read(TOKEN_VARS.success),
    warning: read(TOKEN_VARS.warning),
    danger: read(TOKEN_VARS.danger),
    info: read(TOKEN_VARS.info),
    neutral: read(TOKEN_VARS.neutral),
    accent: read(TOKEN_VARS.accent),
    border: read(TOKEN_VARS.border),
    mutedForeground: read(TOKEN_VARS.mutedForeground),
    foreground: read(TOKEN_VARS.foreground),
    surface: read(TOKEN_VARS.surface),
  };
}

/** Resolves the current theme's chart colors, live-updating on theme toggle. */
export function useChartColors(): ChartColorTokens {
  const { theme } = useTheme();
  const [colors, setColors] = useState<ChartColorTokens>(readTokens);

  useEffect(() => {
    setColors(readTokens());
  }, [theme]);

  return colors;
}

/** Maps a semantic status/priority tone to its resolved chart color. */
export function toneToColor(colors: ChartColorTokens, tone: StatusTone): string {
  return colors[tone];
}
