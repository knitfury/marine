import type { NextConfig } from "next";

// MarineLink - Phase 1 (frontend only, mock APIs/mock data).
//
// PWA-readiness seam (not wired up yet):
//   - public/manifest.json already exists as a placeholder and is picked up
//     automatically by Next's file-based metadata conventions once linked
//     from app/layout.tsx metadata.
//   - A future phase can add a service worker (e.g. via a dedicated PWA
//     plugin, or a hand-rolled sw.js registered from a client component)
//     without needing to restructure this config. When that happens, this
//     is the place to add `headers()` rules for the service worker /
//     manifest cache-control, and any `images.remotePatterns` needed once
//     real (Zoho-backed) media hosts are introduced.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Traces a minimal, self-contained server (.next/standalone) with only the
  // node_modules actually used at runtime - the deployable artifact for a
  // Node host (e.g. Zoho Catalyst AppSail) without shipping a full
  // `npm ci` node_modules copy. `.next/static` and `public` still need to be
  // copied into the standalone output manually before deploying; see Next's
  // own docs on `output: "standalone"` for the exact layout.
  output: "standalone",
};

export default nextConfig;
