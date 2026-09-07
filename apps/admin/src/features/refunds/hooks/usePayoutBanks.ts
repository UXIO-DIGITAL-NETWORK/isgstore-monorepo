import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

export interface PayoutBank {
  code: string;
  name: string | null;
  /** Paid out via the e-wallet rail: keyed on a phone, no account number. */
  is_ewallet: boolean;
}

/**
 * The payout catalogue, served by the API rather than hand-copied.
 *
 * `config/banks.php` is canonical and was already mirrored by hand into the
 * settlement SPA; a third copy here would guarantee the three drift and let an
 * admin pick a code the API then rejects. Cached hard because it is a static
 * list that changes with a backend release, not with data.
 */
export const usePayoutBanks = () =>
  useQuery({
    queryKey: ["payout-banks"],
    queryFn: async (): Promise<PayoutBank[]> => {
      const response: ApiResponse<PayoutBank[]> = await api.get(`${API_VERSION}/payout-banks`);

      return response.data ?? [];
    },
    staleTime: Infinity,
  });
