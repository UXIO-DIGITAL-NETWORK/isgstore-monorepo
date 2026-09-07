import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";

interface ProductApiRow {
  id: number;
  name: string;
  price_member: number;
}

/**
 * Products a flash sale can discount, with their current retail price.
 *
 * The price is carried alongside the label so the editor can show what the
 * sale price is being marked down *from* — the API derives `original_price`
 * from this same field at read time rather than storing a copy.
 */
export const useProductOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["products", "options"],
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<ProductApiRow>> = await api.get(`${API_VERSION}/products`, {
        params: { per_page: 100, status: true },
      });
      return response.data.data;
    },
  });

  const options = useMemo(
    () => (data ?? []).map((row) => ({ value: toRowId(row.id), label: row.name, price: row.price_member })),
    [data],
  );

  return { options, isLoading };
};
