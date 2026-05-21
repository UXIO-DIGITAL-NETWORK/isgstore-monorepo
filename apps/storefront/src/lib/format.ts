const LOCALE_MAP: Record<string, string> = {
  id: "id-ID",
  en: "en-US",
};

function toIntlLocale(locale: string): string {
  return LOCALE_MAP[locale] ?? "id-ID";
}

export function formatCurrency(amount: number, locale = "id"): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, locale = "id"): string {
  return new Intl.NumberFormat(toIntlLocale(locale)).format(num);
}

export function formatDate(date: string | Date, locale = "id"): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function formatDateTime(date: string | Date, locale = "id"): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}
