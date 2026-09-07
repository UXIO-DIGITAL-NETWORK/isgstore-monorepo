import type { NavLink } from "@/types/navbar";

/**
 * Returns the list of navbar navigation links for a given locale.
 * Paths are locale-prefixed and hardcoded; this is a factory, not a fetcher.
 *
 * @param locale - The active locale code (e.g. "id", "en")
 */
export function getNavLinks(locale: string): NavLink[] {
  return [
    { labelKey: "nav.topup", href: `/${locale}` },
    { labelKey: "nav.checkOrder", href: `/${locale}/cek-pesanan` },
    { labelKey: "nav.priceList", href: `/${locale}/daftar-harga` },
    { labelKey: "nav.leaderboard", href: `/${locale}/leaderboard` },
    { labelKey: "nav.news", href: `/${locale}/berita` },
    {
      labelKey: "nav.calculator",
      href: `/${locale}/kalkulator-win-rate`,
      children: [
        {
          labelKey: "nav.calculatorWinRate",
          href: `/${locale}/kalkulator-win-rate`,
        },
        {
          labelKey: "nav.calculatorZodiac",
          href: `/${locale}/kalkulator-zodiac`,
        },
        {
          labelKey: "nav.calculatorMagicWheel",
          href: `/${locale}/kalkulator-magic-wheel`,
        },
      ],
    },
  ];
}
