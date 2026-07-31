import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";

interface CategoryApiRow {
  id: number;
  name: string;
}

/**
 * Game categories, for the banner and announcement scope selects.
 *
 * Duplicated rather than imported from the categories feature: the isolation
 * rule forbids one feature reaching into another, and this needs only the id
 * and the name.
 */
export const useContentCategoryOptions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "options"],
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<CategoryApiRow>> = await api.get(`${API_VERSION}/categories`, {
        params: { per_page: 100 },
      });
      return response.data.data;
    },
  });

  const options = useMemo(
    () => (data ?? []).map((category) => ({ value: toRowId(category.id), label: category.name })),
    [data],
  );

  return { options, isLoading };
};
