import { ok } from "../envelope";
import { MOCK_BALANCE_MUTATIONS, MOCK_TOPUP_RESULT } from "../data/member";
import type { MockHandler } from "../types";

export const walletHandlers: MockHandler[] = [
  { method: "POST", pattern: /^\/v1\/me\/topups$/, resolve: () => ok(MOCK_TOPUP_RESULT) },
  {
    method: "GET",
    pattern: /^\/v1\/me\/topups\/([^/]+)$/,
    resolve: ({ match }) => ok({ ...MOCK_TOPUP_RESULT, reference_id: decodeURIComponent(match[1]), is_terminal: false }),
  },
  { method: "GET", pattern: /^\/v1\/me\/balance-mutations$/, resolve: () => ok({ data: MOCK_BALANCE_MUTATIONS }) },
];
