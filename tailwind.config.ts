import type { Config } from "tailwindcss";

// Tailwind CSS v4 is CSS-first: design tokens live in src/app/globals.css
// under the `@theme` at-rule, and that file is the source of truth for
// colors, radii, shadows and fonts (see the "Design tokens" section there).
//
// This file is kept minimal, only for tooling that still expects a
// tailwind.config.ts to exist (e.g. the shadcn/ui CLI's project detection
// and editors' Tailwind IntelliSense). Content scanning in v4 is automatic
// via the `@import "tailwindcss"` in globals.css, so `content` below is a
// belt-and-suspenders fallback rather than the primary mechanism.
const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,mdx}",
  ],
};

export default config;
