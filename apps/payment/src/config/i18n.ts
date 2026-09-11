import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import idCommon from "@/locales/id/common.json";
import idNav from "@/locales/id/nav.json";
import idMerchant from "@/locales/id/merchant.json";
import idFinance from "@/locales/id/finance.json";
import enCommon from "@/locales/en/common.json";
import enNav from "@/locales/en/nav.json";
import enMerchant from "@/locales/en/merchant.json";
import enFinance from "@/locales/en/finance.json";

/** The languages this panel ships. Mirrors `SupportedLocale::ALL` in the API. */
export const LOCALES = [
  { code: "id", flag: "🇮🇩", labelKey: "language.id" },
  { code: "en", flag: "🇺🇸", labelKey: "language.en" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "id";

export const LOCALE_STORAGE_KEY = "payment-locale";

export const isSupportedLocale = (value: unknown): value is Locale =>
  typeof value === "string" && LOCALES.some((locale) => locale.code === value);

/**
 * The language to start in, before the API has told us anything.
 *
 * `localStorage` only — no `Accept-Language` detection. The account's own
 * `users.locale` is the real answer and arrives with the signed-in user;
 * guessing from the browser first would make the panel flip language a beat
 * after every sign-in.
 */
function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (isSupportedLocale(stored)) return stored;
  } catch {
    // Site data blocked. Not a reason to fail to render.
  }

  return DEFAULT_LOCALE;
}

/**
 * i18n for the payment panel.
 *
 * Same shape as the admin panel's, and for the same reasons: no locale segment
 * in the URL (these screens are not linked in a given language), and the choice
 * stored on `users.locale` so it follows a client to another device.
 *
 * This panel is the one that most needed it — today it is accidentally
 * bilingual, with "Simpan" sitting beside English buttons on the same screen.
 * The namespaces below are the shell only; the rest is extracted per feature.
 */
i18n.use(initReactI18next).init({
  resources: {
    id: { common: idCommon, nav: idNav, merchant: idMerchant, finance: idFinance },
    en: { common: enCommon, nav: enNav, merchant: enMerchant, finance: enFinance },
  },
  lng: initialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  ns: ["common", "nav", "merchant", "finance"],
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
