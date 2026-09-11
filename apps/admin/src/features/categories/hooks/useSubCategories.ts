import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subCategoriesService } from "../services/subCategories.service";
import type { SubCategory, SubCategoryListParams } from "../types/subCategory.type";

export const useSubCategoryList = (params: SubCategoryListParams) =>
  useQuery({
    queryKey: ["sub-categories", "list", params],
    queryFn: () => subCategoriesService.list(params),
  });

export const useSubCategory = (id?: string) =>
  useQuery({
    queryKey: ["sub-categories", "detail", id],
    queryFn: () => subCategoriesService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateSubCategory = () => {
  const { t } = useTranslation("categories");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SubCategory, "id" | "created_at" | "updated_at">) => subCategoriesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast.success(t("subCreated"));
    },
    onError: () => {
      toast.error(t("subCreateFailed"));
    },
  });
};

export const useUpdateSubCategory = () => {
  const { t } = useTranslation("categories");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<SubCategory, "id" | "created_at" | "updated_at">>;
    }) => subCategoriesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast.success(t("subUpdated"));
    },
    onError: () => {
      toast.error(t("subUpdateFailed"));
    },
  });
};

/** One mutation for both delete paths (§4.5 lines 212-214) — the row menu
 * passes a single id, the toolbar's "Delete (N)" passes the selection. */
export const useDeleteSubCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => subCategoriesService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast.success(ids.length === 1 ? "Sub category deleted" : `${ids.length} sub categories deleted`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to delete sub category" : "Failed to delete sub categories");
    },
  });
};
