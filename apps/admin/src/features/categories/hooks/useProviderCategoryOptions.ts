import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** One of the provider's own categories, with how much catalogue sits behind it. */
export interface ProviderCategoryOption {
  /** The provider's free-text `kategori` string — the value we store. */
  value: string;
  /** How many SKUs the provider currently publishes under it. */
  sku_count: number;
  /** How many of those are `aktif` upstream. */
  available_count: number;
  /** Set when this provider category is already mapped to one of our categories. */
  mapped_category_id: string | null;
  mapped_category_name: string | null;
}

interface ProviderCategoryApiRow {
  value: string;
  sku_count: number;
  available_count: number;
  mapped_category_id: number | null;
  mapped_category_name: string | null;
}

/**
 * The provider's own categories, grouped and de-duplicated upstream.
 *
 * The Provider Category select used to offer a hardcoded list whose own comment
 * admitted it was "invented — not confirmed anywhere". Nothing read the value, so
 * a typo was invisible. It now decides which SKUs the pool offers, so the options
 * have to be the real ones: the API groups the live price list by `kategori`, so
 * each value appears exactly once no matter how many SKUs share it, and reports
 * whether it is already mapped.
 *
 * Only uxiotopup has a catalogue integration, so this is meaningless for any other
 * supplier — callers pass `enabled: false` there rather than showing stale options.
 */
export const useProviderCategoryOptions = (enabled = true) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["uxiotopup", "provider-categories"],
    queryFn: async () => {
      const response: ApiResponse<ProviderCategoryApiRow[]> = await api.get(`${API_VERSION}/uxiotopup/categories`);
      return (response.data ?? []).map<ProviderCategoryOption>((row) => ({
        value: row.value,
        sku_count: row.sku_count,
        available_count: row.available_count,
        mapped_category_id: row.mapped_category_id === null ? null : String(row.mapped_category_id),
        mapped_category_name: row.mapped_category_name,
      }));
    },
    enabled,
    // The upstream list is cached for 5 minutes server-side; matching that here
    // keeps opening the dialog repeatedly from re-fetching a list that cannot
    // have changed.
    staleTime: 5 * 60 * 1000,
  });

  return { options: data ?? [], isLoading, isError };
};
