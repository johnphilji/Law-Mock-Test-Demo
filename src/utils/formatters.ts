/**
 * Formatting utilities.
 *
 * All display formatting is centralized here.
 * Never format dates, currencies, or percentages inline in components.
 */
import { format, formatDistanceToNow, differenceInSeconds } from "date-fns";

// =============================================================================
// CURRENCY
// =============================================================================

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatCurrency(amountPaise: number): string {
  return currencyFormatter.format(amountPaise / 100);
}

export function formatCurrencyINR(amountINR: number): string {
  return currencyFormatter.format(amountINR);
}

// =============================================================================
// DATE / TIME
// =============================================================================

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, hh:mm a");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// =============================================================================
// EXAM TIMER
// =============================================================================

/**
 * Format a duration in seconds as HH:MM:SS.
 * Used for exam timer display.
 *
 * IMPORTANT: This is display-only. The server is the authoritative clock.
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) return "00:00:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

/**
 * Calculate remaining seconds between now and a future timestamp.
 *
 * IMPORTANT: This uses the client's clock only for DISPLAY purposes.
 * Server synchronization via the time-sync endpoint is what keeps this accurate.
 * A client cannot extend the exam by manipulating their clock — the server's
 * expiresAt is authoritative.
 */
export function getRemainingSeconds(expiresAt: Date | string): number {
  return Math.max(0, differenceInSeconds(new Date(expiresAt), new Date()));
}

// =============================================================================
// SCORES
// =============================================================================

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatScore(score: number, total: number): string {
  return `${score} / ${total}`;
}

// =============================================================================
// MISC
// =============================================================================

export function formatTimeTaken(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}
