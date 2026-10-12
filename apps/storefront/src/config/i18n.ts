import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

/**
 * Curated namespace list, kept in sync with the files under `src/locales/`.
 * The resources themselves are loaded per locale by `@/locales` (dynamic
 * imports) rather than bundled here — see `loadLocale`, called from the
 * `$locale` route guard before any locale page renders.
 */
export const I18N_NAMESPACES = [
  "common",
  "auth",
  "home",
  "checkout",
  "invoice",
  "dashboard",
  "admin",
  "errors",
  "trackOrder",
  "priceList",
  "berita",
  "kalkulator",
  "zodiac",
  "magicWheel",
  "faq",
  "leaderboard",
  "privacyPolicy",
  "refund",
  "states",
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {},
    lng: "id",
    fallbackLng: "id",
    supportedLngs: ["id", "en"],
    defaultNS: "common",
    ns: [...I18N_NAMESPACES],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["path", "localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
