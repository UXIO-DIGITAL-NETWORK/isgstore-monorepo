import { differenceInDays, differenceInHours, differenceInMinutes, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";

/**
 * The platform's wall clock: WIB, UTC+7.
 *
 * Every date this panel renders is formatted in it, never in the browser's
 * zone — two operators looking at the same invoice must read the same clock.
 * The API sends UTC ISO strings; the conversion happens here, at the edge.
 */
export const PLATFORM_TIMEZONE = "Asia/Jakarta";

/** Appended wherever a time of day is shown, so a bare "18:15" is never ambiguous. */
export const PLATFORM_TIMEZONE_LABEL = "WIB (GMT+7)";

/** An instant read on the WIB clock. The primitive the helpers below share. */
export function formatWib(value: string | Date, pattern: string): string {
  const instant =
    value instanceof Date ? new TZDate(value, PLATFORM_TIMEZONE) : new TZDate(value, PLATFORM_TIMEZONE);

  return format(instant, pattern, { locale: idLocale });
}

/** Compact date+time for tables, e.g. "24 Mei 2026, 14:03 WIB (GMT+7)". */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  return `${formatWib(isoString, "d MMM yyyy, HH:mm")} ${PLATFORM_TIMEZONE_LABEL}`;
}

/**
 * Date only, read on the WIB clock, e.g. "24 Mei 2026". Used for subscription
 * windows, where the time of day is an artefact of when the invoice happened to
 * be confirmed and showing it ("00:00") would read as meaningful precision. No
 * zone label: an offset beside a calendar day would be noise.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  return formatWib(isoString, "d MMM yyyy");
}

/**
 * Coarse relative-time label ("5m Ago" / "3h Ago" / "1d Ago") for feed-style
 * timestamps. Not exhaustive (no "just now"/weeks/months) — this app's
 * activity log only ever shows recent entries; extend the ladder if that
 * changes. A difference between two instants, so it needs no zone.
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
