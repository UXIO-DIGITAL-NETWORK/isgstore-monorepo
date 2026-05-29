import type { LocaleOption } from "@/types/navbar";

export const LOCALES: ReadonlyArray<LocaleOption> = [
  { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { code: "en", flag: "🇺🇸", label: "English" },
] as const;
