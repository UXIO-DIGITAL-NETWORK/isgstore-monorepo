import { useMemo } from "react";

import { useCategoryTypeList } from "./useCategoryTypes";

/**
 * Live options for the category form's Category Type select.
 *
 * The select previously offered a hardcoded list of type *names*. The API
 * stores the relation as a `type_id` foreign key, so the option value has to
 * be a real id or the write is rejected.
 */
export const useCategoryTypeOptions = () => {
  const { data, isLoading } = useCategoryTypeList({ per_page: 100 });

  const options = useMemo(
    () => (data?.data ?? []).map((type) => ({ value: type.id, label: type.name })),
    [data],
  );

  return { options, isLoading };
};
