/**
 * Where an operator-entered banner link points.
 *
 * The admin panel takes free text, so two shapes arrive: an absolute URL to
 * somewhere else, and a path on this storefront. An absolute URL is left alone;
 * a path gets the locale prefix the router needs, because an operator typing
 * "/berita" means the page in the language the visitor is reading — not a
 * prefix-less path that would bounce them to the default locale.
 *
 * Lives in `lib/` so it can be tested: this app's Vitest glob is
 * `src/**\/*.test.ts`, which never runs a `.tsx` file.
 */
export function bannerHref(link: string | null | undefined, locale: string): string | null {
  if (!link) return null;

  if (/^https?:\/\//i.test(link)) return link;

  const path = link.startsWith("/") ? link : `/${link}`;

  return path === `/${locale}` || path.startsWith(`/${locale}/`) ? path : `/${locale}${path}`;
}
