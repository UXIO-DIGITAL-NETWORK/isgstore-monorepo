import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import { wibDay } from "./format"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number with comma separators.
 * @example formatNumber(1234567)
 * @param num number
 * @returns string (e.g. "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

/**
 * Convert a string to a slug (lowercase, hyphenated).
 * @example toSlug("The Best Product")
 * @param str string
 * @returns string (e.g. "the-best-product")
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")   // remove non-word chars
    .replace(/\s+/g, "-")      // replace spaces with hyphens
    .replace(/--+/g, "-")      // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");  // trim leading/trailing hyphens
}

/**
 * Calculate remaining days from a target date.
 * @example daysLeft("2026-12-31")
 * @param targetDate string (YYYY-MM-DD)
 * @returns number (remaining days, or 0 if past)
 */
export function daysLeft(targetDate: string): number {
  const DAY_MS = 1000 * 60 * 60 * 24;

  // Both ends are read as WIB calendar days. A deadline is a day on the
  // platform's clock, so the visitor's own zone must not move it — a browser
  // west of Greenwich would otherwise report one day less all evening.
  const target = Date.parse(`${wibDay(targetDate)}T00:00:00Z`);
  const today = Date.parse(`${wibDay(new Date())}T00:00:00Z`);

  const days = Math.ceil((target - today) / DAY_MS);

  return days > 0 ? days : 0;
}
