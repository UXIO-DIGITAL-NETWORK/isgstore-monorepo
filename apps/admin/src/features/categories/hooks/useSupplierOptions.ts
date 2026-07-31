import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";

interface SupplierApiRow {
  id: number;
  name: string;
  status: boolean;
}

/**
 * Live `SelectField` options for "pick a provider".
 *
 * The provider select used to offer a hardcoded list of names, which was fine
 * while the service was mock-backed. The API stores the relationship as a
 * `supplier_id` foreign key, so the option value has to be a real id — a name
 * cannot be resolved to a supplier server-side, and the write would be
 * rejected.
 */
export const useSupplierOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", "list", { per_page: 100 }],
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<SupplierApiRow>> = await api.get(`${API_VERSION}/suppliers`, {
        params: { per_page: 100 },
      });
      return response.data.data;
    },
  });

  const options = useMemo(
    () => (data ?? []).map((supplier) => ({ value: toRowId(supplier.id), label: supplier.name })),
    [data],
  );

  return { options, isLoading };
};
