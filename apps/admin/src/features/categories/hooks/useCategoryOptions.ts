import { useMemo } from "react";

import { useCategoryList } from "./useCategories";

/**
 * Live `SelectField` options for "pick a category".
 *
 * Every form in this feature that references a parent category needs the same
 * list, and it has to come from the API now that the select feeds a real
 * foreign key — a hardcoded option list would submit ids that do not exist.
 * `per_page: 100` covers the catalogue comfortably; the picker is a select,
 * not a paginated table.
 */
export const useCategoryOptions = () => {
  const { data, isLoading } = useCategoryList({ per_page: 100 });

  const options = useMemo(
    () => (data?.data ?? []).map((category) => ({ value: category.id, label: category.name })),
    [data],
  );

  return { options, isLoading };
};
