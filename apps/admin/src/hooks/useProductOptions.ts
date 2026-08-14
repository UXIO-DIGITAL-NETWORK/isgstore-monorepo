import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { unwrapPaginated } from "@/lib/apiMappers";
import { API_VERSION } from "@/config/env";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";

interface ProductOptionRow {
  id: number;
  name: string;
  category?: { id: number; name: string } | null;
}

export interface ProductOption {
  /** Stored verbatim as the nickname provider — `product:{id}`. */
  value: string;
  label: string;
}

/**
 * Products as `{value: "product:{id}", label}` options, shared (outside any
 * feature) so both the categories form and future callers can pick a product
 * without a cross-feature import. Only fetched when `enabled`.
 */
export const useProductOptions = (enabled = true) => {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "options"],
    enabled,
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<ProductOptionRow>> = await api.get(`${API_VERSION}/products`, {
        params: { per_page: 200 },
      });

      return unwrapPaginated(response, (row: ProductOptionRow) => ({
        value: `product:${row.id}`,
        label: row.category?.name ? `${row.category.name} — ${row.name}` : row.name,
      })).data;
    },
  });

  return { options: data ?? [], isLoading };
};
