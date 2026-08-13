import { differenceInMinutes, differenceInHours, differenceInDays, format } from "date-fns";

/**
 * Coarse relative-time label ("5m Ago" / "3h Ago" / "1d Ago") for feed-style
 * timestamps. Not exhaustive (no "just now"/weeks/months) — this app's
 * activity log only ever shows recent entries; extend the ladder if that
 * changes.
 */
export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return `${minutes}m Ago`;

  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours}h Ago`;

  return `${differenceInDays(now, date)}d Ago`;
}

/** Welcome-banner date string, e.g. "It's Friday, May 24, 2026!" */
export function formatBannerDate(date: Date): string {
  return `It's ${format(date, "EEEE, MMMM d, yyyy")}!`;
}

/** Compact date+time for tables, e.g. "24 May 2026, 14:03". */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  return format(new Date(isoString), "d MMM yyyy, HH:mm");
}

/**
 * Date only, e.g. "24 May 2026". Used for subscription windows, where the time
 * of day is an artefact of when the invoice happened to be confirmed and
 * showing it ("00:00") would read as meaningful precision.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  return format(new Date(isoString), "d MMM yyyy");
}
