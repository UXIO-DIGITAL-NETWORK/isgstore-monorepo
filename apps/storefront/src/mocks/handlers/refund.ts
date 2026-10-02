import { ok } from "../envelope";
import { MOCK_PAYOUT_BANKS, MOCK_REFUND_CLAIM, MOCK_USER } from "../data/member";
import type { MockHandler } from "../types";

export const refundHandlers: MockHandler[] = [
  { method: "GET", pattern: /^\/v1\/payout-banks$/, resolve: () => ok(MOCK_PAYOUT_BANKS) },
  { method: "POST", pattern: /^\/v1\/refund-claims\/resend$/, resolve: () => ok(null, "Tautan telah dikirim.") },
  // The claim behind a one-time link. Any token resolves to the demo claim.
  { method: "GET", pattern: /^\/v1\/refund-claims\/[^/]+$/, resolve: () => ok(MOCK_REFUND_CLAIM) },
  {
    method: "POST",
    pattern: /^\/v1\/refund-claims\/[^/]+\/register$/,
    resolve: () =>
      ok(
        {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: MOCK_USER,
          refund: MOCK_REFUND_CLAIM,
        },
        "Akun berhasil dibuat.",
      ),
  },
  { method: "POST", pattern: /^\/v1\/refund-claims\/[^/]+\/attach$/, resolve: () => ok(MOCK_REFUND_CLAIM) },
  {
    method: "POST",
    pattern: /^\/v1\/refund-claims\/[^/]+\/payout-details$/,
    resolve: () =>
      ok({
        ...MOCK_REFUND_CLAIM,
        status: "PENDING",
        can_submit_payout: false,
        payout: {
          bank_code: "BCA",
          bank_name: "Bank Central Asia",
          account_number: "1234567890",
          account_name: "Budi Santoso",
          submitted_at: new Date().toISOString(),
        },
      }),
  },
];
