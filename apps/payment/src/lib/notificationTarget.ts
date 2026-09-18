/**
 * Where a notification takes you when you open it.
 *
 * Keyed on the notification's `type`, deliberately, and never on its `data`:
 * those keys are an internal contract (the payload's own comment calls them "for
 * future deep-linking"), so a link assembled from a guessed key name would
 * silently point at the wrong record. The type is the stable half.
 *
 * Role-aware because the bell and the feed are shared by both audiences, and
 * their pages are not: the same `withdrawal_request` means the client's own
 * payouts to one reader and the whole queue to the other. Sending a client to a
 * `payment-internal` route (or the reverse) would bounce them off a permission
 * guard with no explanation.
 *
 * A type with no entry returns undefined and the row stays inert rather than
 * pretending to be a link.
 */
export type NotificationAudience = "client" | "internal";

const TARGETS: Record<NotificationAudience, Record<string, string>> = {
  client: {
    transaction_sale: "/app/payment-admin/transactions",
    service_payment: "/app/payment-admin/services?tab=invoices",
    withdrawal_request: "/app/payment-admin/withdrawals",
    // A subscription has no page of its own on the client side; the services
    // page is where the plan, the renewal dates and the outstanding bill live.
    subscription_expiring: "/app/payment-admin/services",
  },
  internal: {
    transaction_sale: "/app/payment-internal/transactions",
    service_payment: "/app/payment-internal/invoices",
    withdrawal_request: "/app/payment-internal/withdrawals",
    subscription_expiring: "/app/payment-internal/subscriptions",
  },
};

export function notificationTarget(
  type: string | null | undefined,
  audience: NotificationAudience,
): string | undefined {
  return type ? TARGETS[audience][type] : undefined;
}
