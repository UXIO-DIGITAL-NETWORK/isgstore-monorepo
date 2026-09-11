import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { authService } from "@/features/auth/services/auth.service";
import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_STORAGE_KEY, type Locale } from "@/config/i18n";
import { useAuthStore } from "@/store/useAuthStore";

const remember = (locale: Locale) => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Site data blocked — the choice still applies for this session.
  }
};

/**
 * The panel's language, and the one place it is changed.
 *
 * Three copies of the answer exist and they have to agree: i18next (what is on
 * screen), `localStorage` (what the next cold load starts in, before any
 * request has returned), and `users.locale` (the real record, which is what
 * makes the choice follow an admin to a different device and what the API reads
 * to decide which language to answer in).
 *
 * Writing all three from one place is the point. A switcher that only called
 * `i18n.changeLanguage` would forget on reload; one that only wrote
 * localStorage would leave the API replying in the other language.
 */
export function useLocale() {
  const { i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);

  const current: Locale = isSupportedLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE;

  // The signed-in account is the authority, so adopt it when it disagrees —
  // that is what makes the choice arrive on a device that has never seen it.
  // Only ever pulls; pushing back from here would fight the setter below.
  useEffect(() => {
    const stored = user?.locale;

    if (isSupportedLocale(stored) && stored !== current) {
      void i18n.changeLanguage(stored);
      remember(stored);
    }
  }, [user?.locale, current, i18n]);

  const setLocale = useCallback(
    (locale: Locale) => {
      if (locale === current) return;

      // On screen first: the language must change the moment it is clicked,
      // not when a round trip returns.
      void i18n.changeLanguage(locale);
      remember(locale);

      if (!user) return;

      patchUser({ locale });
      // Fire and forget, deliberately. A failed sync leaves the panel in the
      // chosen language with the server still on the old one — mildly wrong and
      // self-correcting on the next change, which beats blocking the UI or
      // throwing a toast at someone for picking a language.
      void authService.updateLocale(locale).catch(() => undefined);
    },
    [current, i18n, patchUser, user],
  );

  return { locale: current, setLocale };
}
