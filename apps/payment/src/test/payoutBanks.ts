import { vi } from "vitest";

import * as payoutBanks from "@/hooks/usePayoutBanks";

/**
 * A small stand-in for the ~170-entry catalogue `GET /v1/payout-banks` serves.
 *
 * Deliberately not the whole list: a test that asserts on a picker only needs
 * enough rows to prove filtering keeps one and drops another, plus one of each
 * rail so the account-number-vs-phone branch is exercised. Every entry here is
 * a real code from `config/banks.php`.
 */
export const PAYOUT_BANKS: payoutBanks.PayoutBank[] = [
  { code: "BCA", name: "Bank Central Asia (BCA)", is_ewallet: false },
  { code: "BNC", name: "Bank Neo Commerce", is_ewallet: false },
  { code: "MANDIRI", name: "Bank Mandiri", is_ewallet: false },
  { code: "GOPAY", name: "GoPay", is_ewallet: true },
  { code: "DANA", name: "DANA", is_ewallet: true },
];

/**
 * Stub the catalogue query. Page tests mock the hook rather than the request so
 * the list is there on first render — the picker has no loading state of its
 * own to wait on.
 */
export const mockPayoutBanks = (banks: payoutBanks.PayoutBank[] = PAYOUT_BANKS) =>
  vi.spyOn(payoutBanks, "usePayoutBanks").mockReturnValue({
    data: banks,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof payoutBanks.usePayoutBanks>);
