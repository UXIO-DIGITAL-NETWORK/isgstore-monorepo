/**
 * The client's wording for a subscription's status.
 *
 * Mirrors the API's `SubscriptionStatus` enum — ACTIVE (inside its window),
 * EXPIRED (the window passed with nothing renewing it), CANCELLED (ended early
 * by kita) — so the services page stops showing "ACTIVE" to someone who is
 * being billed in rupiah.
 */
const KEY: Record<string, string> = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
};

export function subscriptionStatusLabelKey(status: string | null | undefined): string | undefined {
  return status && KEY[status] ? `subscriptionStatus.${KEY[status]}` : undefined;
}
