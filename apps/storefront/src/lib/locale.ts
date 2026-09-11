import { LOCALES } from "@/constants/locales";

const CODES: readonly string[] = LOCALES.map((locale) => locale.code);

export const isSupportedLocale = (segment: string): boolean => CODES.includes(segment);

/**
 * The same URL, read in another language.
 *
 * The language dropdown used to call `navigate({ to: "/$locale" })`, which is
 * the locale **root** — so switching language on `/id/checkout/INV-123` dropped
 * the buyer on `/en`, mid-purchase, with the invoice they were paying nowhere
 * on screen. `CLAUDE.md` described replacing the first segment all along.
 *
 * Kept here rather than inside the hook because storefront's Vitest only runs
 * `.ts` files — logic that deserves a test has to live in `lib/`.
 *
 * A path with no locale prefix is prefixed rather than rewritten: the first
 * segment of `/invoice/INV-1` is a page, not a language, and eating it would
 * turn a language switch into a broken link.
 */
export function swapLocaleInPath(pathname: string, nextLocale: string): string {
  // Split the query and hash off first — they belong to the page, not the path,
  // and `/id/refund?invoice=…` must keep the invoice it was opened with.
  const separator = pathname.search(/[?#]/);
  const path = separator === -1 ? pathname : pathname.slice(0, separator);
  const suffix = separator === -1 ? "" : pathname.slice(separator);

  const segments = path.split("/").filter(Boolean);

  if (segments.length > 0 && isSupportedLocale(segments[0])) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  return `/${segments.join("/")}${suffix}`;
}
