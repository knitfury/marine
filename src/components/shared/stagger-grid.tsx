"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  /** Delay (seconds) between each child's entrance. Kept short per spec 18 (~0.04-0.06s). */
  staggerDelay?: number;
}

const containerVariants = (staggerDelay: number): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerDelay },
  },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
};

const reducedItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01 } },
};

/**
 * Wraps a grid/list of cards with a small staggered fade+slide entrance
 * (spec 18). Pair with `<StaggerItem>` around each child. Renders every
 * child immediately (no delay/movement) when `prefers-reduced-motion` is
 * set - only the timing is skipped, content is never hidden.
 */
export function StaggerGrid({ children, className, staggerDelay = 0.05 }: StaggerGridProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="show"
      variants={containerVariants(prefersReducedMotion ? 0 : staggerDelay)}
    >
      {children}
    </motion.div>
  );
}

export interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

/** A single entrance-animated child of a `<StaggerGrid>`. */
export function StaggerItem({ children, className }: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div className={cn(className)} variants={prefersReducedMotion ? reducedItemVariants : itemVariants}>
      {children}
    </motion.div>
  );
}
