"use client";

import { Sun, Moon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/providers/theme-provider";

/** Icon button toggling light/dark theme via `useTheme()`. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </Button>
  );
}
