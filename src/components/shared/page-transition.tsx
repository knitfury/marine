"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface PageTransitionProps {
  children: ReactNode;
}

/** Fades + slightly shifts content in on route change; a no-op fade (no vertical movement) when `prefers-reduced-motion` is set. */
export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -8 }}
        transition={{ duration: prefersReducedMotion ? 0.01 : 0.18, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
