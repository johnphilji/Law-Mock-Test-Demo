/**
 * Tailwind class merging utility.
 *
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 * Use this everywhere in components instead of manual string concatenation.
 *
 * Example:
 *   cn("bg-red-500", isActive && "bg-blue-500") → "bg-blue-500"
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
