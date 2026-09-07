import { useMemo } from "react";

import { useSettingsQuery, type PublicSettings } from "@/hooks/useSettingsQuery";

/**
 * Typed readers over the flat public-settings map.
 *
 * Everything the storefront renders from settings is optional: a key can be
 * absent (an environment whose migration has not run) or blank (an admin who
 * left it empty), and those are the same thing to a consumer — fall back. The
 * readers below collapse both cases to `undefined` so a caller can write
 * `text("site_name") ?? t("brand.name")` and never render an empty heading.
 */
export interface SiteSettings {
  /** A non-blank string value, or undefined. */
  text: (key: string) => string | undefined;
  /** A `true`-ish boolean setting. */
  flag: (key: string) => boolean;
  /** Whether the settings have been fetched at least once. */
  isLoaded: boolean;
  raw: PublicSettings;
}

export function useSiteSettings(): SiteSettings {
  const { data, isSuccess } = useSettingsQuery();

  return useMemo<SiteSettings>(() => {
    const raw = data?.data ?? {};

    const text = (key: string): string | undefined => {
      const value = raw[key];
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    };

    return {
      text,
      // The API coerces a boolean setting for us, but a value that reached the
      // table as text ("1") predates that coercion, so both are accepted.
      flag: (key: string) => raw[key] === true || raw[key] === "1" || raw[key] === 1,
      isLoaded: isSuccess,
      raw,
    };
  }, [data, isSuccess]);
}

/** `wa.me` deep link for a stored WhatsApp number, or undefined if unusable. */
export function whatsappLink(number: string | undefined): string | undefined {
  if (!number) return undefined;
  const digits = number.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : undefined;
}
