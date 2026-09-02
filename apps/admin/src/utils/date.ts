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

/**
 * A calendar day as `YYYY-MM-DD`, read from the date's *local* fields.
 *
 * Never use `toISOString().slice(0, 10)` here: that renders the UTC day, so a
 * local-midnight pick east of Greenwich reports the previous date. The API
 * only accepts this format precisely so the day the admin clicked and the day
 * the server aggregates can never diverge.
 */
export function toApiDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
