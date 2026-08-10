import { ENV, API_VERSION } from "@/config/env";

/** Public URL of the invoice PDF (the backend serves it with Content-Disposition: attachment). */
export function invoiceDownloadUrl(invoiceNumber: string, locale: string): string {
  const lang = locale === "en" ? "en" : "id";
  // Strip a trailing slash so a base like ".../api/" doesn't yield ".../api//v1".
  const base = ENV.API_BASE_URL.replace(/\/+$/, "");
  return `${base}${API_VERSION}/invoices/${encodeURIComponent(invoiceNumber)}/download?locale=${lang}`;
}

/**
 * Triggers the invoice PDF download. The endpoint is public and sets an
 * attachment header, so a plain anchor works — no axios (its interceptor
 * unwraps the JSON envelope and would corrupt a binary body).
 */
export function downloadInvoice(invoiceNumber: string, locale: string): void {
  const anchor = document.createElement("a");
  anchor.href = invoiceDownloadUrl(invoiceNumber, locale);
  anchor.target = "_blank";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
