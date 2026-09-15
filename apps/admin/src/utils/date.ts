import { differenceInDays, differenceInHours, differenceInMinutes, endOfDay, format, startOfDay } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";

/**
 * The platform's wall clock: WIB, UTC+7.
 *
 * Every date this panel renders is formatted in it, never in the browser's
 * zone. Two admins looking at the same order must read the same clock, and the
 * API buckets its report windows on this same day boundary — see
 * `PeriodResolver` there. The API sends UTC ISO strings; the conversion happens
 * here, at the edge.
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

/** Date and time in WIB, e.g. "15 Agt 2026, 18:15 WIB (GMT+7)". */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "-";
  return `${formatWib(value, "d MMM yyyy, HH:mm")} ${PLATFORM_TIMEZONE_LABEL}`;
}

/** Date and time to the second, for logs where the seconds are the point. */
export function formatDateTimeSeconds(value: string | null | undefined): string {
  if (!value) return "-";
  return `${formatWib(value, "d MMM yyyy, HH:mm:ss")} ${PLATFORM_TIMEZONE_LABEL}`;
}

/**
 * Date only, read on the WIB clock. No zone label: an offset beside a calendar
 * day would be noise.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  return formatWib(value, "d MMM yyyy");
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

/** Welcome-banner date, e.g. "Minggu, 24 Mei 2026". */
export function formatBannerDate(date: Date): string {
  return formatWib(date, "EEEE, d MMMM yyyy");
}

/**
 * A calendar day as `YYYY-MM-DD`, read from the WIB clock.
 *
 * The API aggregates requests by calendar day in this same zone, so the day the
 * admin clicked and the day the server buckets must be the same one. Never
 * `toISOString().slice(0, 10)` here: that renders the UTC day, which is still
 * yesterday for the first seven hours of a WIB morning.
 */
export function toApiDate(date: Date): string {
  return formatWib(date, "yyyy-MM-dd");
}

/**
 * The WIB day's bounds as UTC instants, for requests that compare raw ISO
 * strings.
 *
 * `TZDate.toISOString()` renders the zone's offset (`+07:00`), so the bounds are
 * rebuilt as plain Dates first — the API has always received `...Z` here and
 * should keep doing so. Without the TZDate the window would be the browser's
 * local day, which drifts from the day the server aggregates by up to seven
 * hours.
 */
export function wibDayRange(at: Date = new Date()): { start: string; end: string } {
  const day = new TZDate(at, PLATFORM_TIMEZONE);

  return {
    start: new Date(startOfDay(day).getTime()).toISOString(),
    end: new Date(endOfDay(day).getTime()).toISOString(),
  };
}
