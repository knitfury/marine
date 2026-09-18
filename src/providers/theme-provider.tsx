"use client";

/**
 * Minimal light/dark theme provider seam.
 *
 * This intentionally does NOT use the `next-themes` package (not in the
 * approved Phase 1 dependency list) - it's a small hand-rolled context that
 * toggles the `dark` class on <html>, which is what src/app/globals.css's
 * `.dark` token overrides key off of. A later phase can extend this (e.g.
 * add a "system" option that watches prefers-color-scheme, or swap the
 * implementation for next-themes) without changing the public API that
 * components consume via `useTheme()`.
 */

import * as React from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "marinelink-theme";

function applyThemeClass(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function readStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    // localStorage can throw (private browsing, blocked storage, etc.) -
    // fall back to the default theme rather than crashing the app.
    return null;
  }
}

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default theme when nothing is stored yet. Defaults to "light". */
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = "light" }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);

  // On mount, adopt any previously stored preference.
  React.useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
      applyThemeClass(stored);
    } else {
      applyThemeClass(defaultTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeClass(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; theme still applies for this session.
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
