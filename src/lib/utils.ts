import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Standard shadcn/ui `cn()` helper: merges class lists with `clsx`, then
 * resolves conflicting Tailwind utility classes with `tailwind-merge`.
 * shadcn components generated later (via the CLI - see components.json)
 * expect this exact export at "@/lib/utils".
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
