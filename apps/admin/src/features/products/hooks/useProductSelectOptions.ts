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

interface SubCategoryApiRow {
  id: number;
  category_id: number;
  name: string;
}

/**
 * Live category and sub-category options for the product form.
 *
 * These used to come from a hardcoded list keyed on category *name*. Now that
 * products write to the real API, the select has to submit a real
 * `category_id` — a name cannot be resolved server-side and the write would be
 * rejected.
 */
export const useProductSelectOptions = (categoryId?: string) => {
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", "options"],
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<CategoryApiRow>> = await api.get(`${API_VERSION}/categories`, {
        params: { per_page: 100 },
      });
      return response.data.data;
    },
  });

  // Sub-categories belong to a category, so the list follows the choice above
  // it rather than offering every entry.
  const { data: subCategories } = useQuery({
    queryKey: ["sub-categories", "options", categoryId],
    queryFn: async () => {
      const response: ApiResponse<PaginatedResponse<SubCategoryApiRow>> = await api.get(
        `${API_VERSION}/sub-categories`,
        { params: { category_id: categoryId, per_page: 100 } },
      );
      return response.data.data;
    },
    enabled: Boolean(categoryId),
  });

  const categoryOptions = useMemo(
    () => (categories ?? []).map((row) => ({ value: toRowId(row.id), label: row.name })),
    [categories],
  );

  const subCategoryOptions = useMemo(
    () => (subCategories ?? []).map((row) => ({ value: toRowId(row.id), label: row.name })),
    [subCategories],
  );

  return { categoryOptions, subCategoryOptions, categoriesLoading };
};
