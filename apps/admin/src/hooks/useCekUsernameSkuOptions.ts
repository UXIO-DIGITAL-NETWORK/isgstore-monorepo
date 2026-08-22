import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

interface CekUsernameSkuRow {
  sku: string;
  label: string;
}

export interface CekUsernameSkuOption {
  /** Stored verbatim as the nickname provider — `digiflazz:{sku}`. */
  value: string;
  label: string;
}

/**
 * Digiflazz cek-username SKUs as `{value: "digiflazz:{sku}", label}` options,
 * shared (outside any feature) so the categories form — and future callers — can
 * pick one without pasting a raw SKU. The endpoint returns a flat list (not
 * paginated); only fetched when `enabled`.
 */
export const useCekUsernameSkuOptions = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: ["digiflazz", "cek-username-skus"],
    enabled,
    queryFn: async () => {
      const response: ApiResponse<CekUsernameSkuRow[]> = await api.get(`${API_VERSION}/digiflazz/cek-username-skus`);

      return (response.data ?? []).map((row): CekUsernameSkuOption => ({
        value: `digiflazz:${row.sku}`,
        label: row.label,
      }));
    },
  });

  return { options: data ?? [], isLoading };
};
