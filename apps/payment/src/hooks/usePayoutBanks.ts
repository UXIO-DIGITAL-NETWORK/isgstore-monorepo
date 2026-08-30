import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** A payout destination as the API serves it from `config/banks.php`. */
export interface PayoutBank {
  code: string;
  name: string | null;
  /** Paid out via Monetapay's e-wallet rail: keyed on a phone, no account number. */
  is_ewallet: boolean;
}

/**
 * The payout catalogue, fetched rather than bundled.
 *
 * `config/banks.php` is canonical — it validates `bank_code` on withdrawal and
 * decides which Monetapay rail the payout takes. This SPA used to carry a
 * hand-maintained copy in `src/constants/bankCodes.ts`, and the refund work
 * would have made it a third copy alongside the admin panel's. The two lists
 * happened to still agree the day this was replaced; nothing was keeping them
 * that way, and the failure is silent — an operator picks a code the API then
 * rejects, or an e-wallet gets classified as a bank and the payout is keyed on
 * an account number Monetapay has no use for.
 *
 * Cached indefinitely: it changes with a backend release, not with data.
 */
export const usePayoutBanks = () =>
  useQuery({
    queryKey: ["payout-banks"],
    queryFn: async (): Promise<PayoutBank[]> => {
      const res: ApiResponse<PayoutBank[]> = await api.get(`${API_VERSION}/payout-banks`);
      // Guarded rather than `?? []`: every consumer maps over this, so a body
      // that is anything but a list has to degrade to an empty picker, not a
      // crashed withdrawal form.
      return Array.isArray(res.data) ? res.data : [];
    },
    staleTime: Infinity,
  });

/**
 * Whether a picked code is paid out as an e-wallet. Unknown codes — including
 * the empty form default and anything picked before the catalogue arrives —
 * count as bank transfers: that asks for an account number, and asking for one
 * needlessly is recoverable in a way that omitting it is not.
 */
export function isEwalletCode(banks: PayoutBank[], code: string | undefined | null): boolean {
  if (!code) return false;
  return banks.find((bank) => bank.code === code)?.is_ewallet ?? false;
}

/** How every picker and summary spells a destination. */
export function bankLabel(bank: PayoutBank): string {
  return bank.name ? `${bank.code} — ${bank.name}` : bank.code;
}
