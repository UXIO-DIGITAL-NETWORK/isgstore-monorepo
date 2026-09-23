const LOCALE_MAP: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
};

function toIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? "id-ID";
}

/**
 * The platform's wall clock: WIB, UTC+7.
 *
 * Every date the storefront renders is formatted in it, never in the visitor's
 * browser zone — an order's timestamp must read the same to the customer, the
 * merchant and the admin. The API sends UTC ISO strings; the conversion happens
 * here, at the edge.
 */
export const PLATFORM_TIMEZONE = "Asia/Jakarta";

/** Appended wherever a time of day is shown, so a bare "18:15" is never ambiguous. */
export const PLATFORM_TIMEZONE_LABEL = "WIB (GMT+7)";

/**
 * The WIB calendar day for an instant, as `YYYY-MM-DD`.
 *
 * Never `toISOString().slice(0, 10)`: that renders the UTC day, which is still
 * yesterday for the first seven hours of a WIB morning. Assembled from parts
 * rather than a locale's date order, so it cannot be reordered by ICU.
 */
export function wibDay(value: string | Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: PLATFORM_TIMEZONE,
  }).formatToParts(typeof value === "string" ? new Date(value) : value);

  const field = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return `${field("year")}-${field("month")}-${field("day")}`;
}

/**
 * Rupiah, always written as rupiah.
 *
 * **`locale` is accepted but deliberately ignored here** — do not "fix" it.
 * Routing the currency through the page locale meant every `/en/...` page
 * rendered `IDR 15,231` instead of `Rp 15.231`: `Intl` swaps to the ISO code
 * for a currency that is foreign to the formatting locale. The store prices in
 * rupiah whichever language the customer reads, so the currency is pinned to
 * `id-ID` and the parameter stays only so the ~45 call sites keep compiling.
 * `formatDate` and `formatNumber` below still honour it.
 *
 * A non-finite value renders as "-" rather than "RpNaN". `Intl` happily formats
 * `undefined`, so a field the API stopped sending would otherwise reach the
 * screen looking like a price. An em dash is a visible absence.
 */
export function formatCurrency(amount: number, locale = "id"): string {
  // Referenced but never read, so the linter can tell "deliberately ignored"
  // (see the docblock) from "forgot to use". The parameter cannot simply be
  // dropped: ~45 call sites still pass the page locale as a second argument.
  void locale;

  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(amount)
    // Intl emits a non-breaking space after "Rp"; a plain one copies and wraps
    // predictably and matches what the other two apps produce.
    .replace(/\u00A0/g, " ");
}

export function formatNumber(num: number, locale = "id"): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(num);
}

export function formatDate(date: string | Date, locale = "id"): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: PLATFORM_TIMEZONE,
  }).format(typeof date === "string" ? new Date(date) : date);
}

/**
 * Date and time, e.g. "24 Mei 2026, 14.03 WIB (GMT+7)". The zone label rides
 * along because a bare clock time in an order history is ambiguous.
 */
export function formatDateTime(date: string | Date, locale = "id"): string {
  const rendered = new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PLATFORM_TIMEZONE,
  }).format(typeof date === "string" ? new Date(date) : date);

  return `${rendered} ${PLATFORM_TIMEZONE_LABEL}`;
}
