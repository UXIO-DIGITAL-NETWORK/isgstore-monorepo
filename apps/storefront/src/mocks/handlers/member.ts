import { ok, paginate } from "../envelope";
import { MOCK_CURRENT_MEMBERSHIP } from "../data/commerce";
import {
  MOCK_ACTIVITY_LOGS,
  MOCK_CREDENTIALS,
  MOCK_DASHBOARD,
  MOCK_ISSUED_CREDENTIAL,
  MOCK_MEMBER_REFUNDS,
  MOCK_POINTS,
  MOCK_TRANSACTIONS,
  MOCK_USER,
} from "../data/member";
import type { MockHandler, MockRequest } from "../types";

const MEMBERSHIP_END = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

function autoRenew(request: MockRequest) {
  const body = (request.body ?? {}) as { auto_renew?: boolean };
  return ok({ auto_renew: Boolean(body.auto_renew) });
}

export const memberHandlers: MockHandler[] = [
  { method: "GET", pattern: /^\/v1\/me\/points$/, resolve: () => ok(MOCK_POINTS) },
  { method: "GET", pattern: /^\/v1\/me\/dashboard$/, resolve: () => ok(MOCK_DASHBOARD) },
  {
    method: "GET",
    pattern: /^\/v1\/me\/transactions$/,
    resolve: ({ params }) => paginate(MOCK_TRANSACTIONS, params, "/v1/me/transactions"),
  },
  {
    method: "GET",
    pattern: /^\/v1\/me\/activity-logs$/,
    resolve: ({ params }) => paginate(MOCK_ACTIVITY_LOGS, params, "/v1/me/activity-logs"),
  },
  { method: "GET", pattern: /^\/v1\/me\/refunds$/, resolve: () => ok({ data: MOCK_MEMBER_REFUNDS }) },
  { method: "GET", pattern: /^\/v1\/me\/membership$/, resolve: () => ok(MOCK_CURRENT_MEMBERSHIP) },
  { method: "PATCH", pattern: /^\/v1\/me\/membership\/auto-renew$/, resolve: autoRenew },
  { method: "POST", pattern: /^\/v1\/me\/membership\/subscribe$/, resolve: () => ok({ ends_at: MEMBERSHIP_END }) },
  { method: "GET", pattern: /^\/v1\/me\/api-credentials$/, resolve: () => ok(MOCK_CREDENTIALS) },
  { method: "POST", pattern: /^\/v1\/me\/api-credentials$/, resolve: () => ok(MOCK_ISSUED_CREDENTIAL) },
  {
    method: "POST",
    pattern: /^\/v1\/me\/api-credentials\/\d+\/regenerate$/,
    resolve: () => ok(MOCK_ISSUED_CREDENTIAL),
  },
  {
    method: "PUT",
    pattern: /^\/v1\/me\/api-credentials\/\d+$/,
    resolve: () => ok(MOCK_CREDENTIALS.credentials[0]),
  },
  { method: "PUT", pattern: /^\/v1\/me\/password$/, resolve: () => ok(null, "Kata sandi berhasil diubah.") },
  { method: "PUT", pattern: /^\/v1\/me$/, resolve: () => ok(MOCK_USER, "Profil berhasil diperbarui.") },
  { method: "POST", pattern: /^\/v1\/me$/, resolve: () => ok(MOCK_USER, "Profil berhasil diperbarui.") },
];
