import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryTypesService } from "../services/categoryTypes.service";
import type { CategoryStatus } from "../types/category.type";
import type { CategoryType, CategoryTypeListParams } from "../types/categoryType.type";

export const useCategoryTypeList = (params: CategoryTypeListParams) =>
  useQuery({
    queryKey: ["category-types", "list", params],
    queryFn: () => categoryTypesService.list(params),
  });

export const useCategoryType = (id?: string) =>
  useQuery({
    queryKey: ["category-types", "detail", id],
    queryFn: () => categoryTypesService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateCategoryType = () => {
  const { t } = useTranslation("categories");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CategoryType, "id" | "created_at" | "updated_at">) => categoryTypesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-types"] });
      toast.success(t("typeCreated"));
    },
    onError: () => {
      toast.error(t("typeCreateFailed"));
    },
  });
};

export const useUpdateCategoryType = () => {
  const { t } = useTranslation("categories");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<CategoryType, "id" | "created_at" | "updated_at">>;
    }) => categoryTypesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-types"] });
      toast.success(t("typeUpdated"));
    },
    onError: () => {
      toast.error(t("typeUpdateFailed"));
    },
  });
};

/** Backs the row menu's Deactive/Activate action (§4.5) — reversible, so the
 * toast reflects the direction rather than reading like a deletion. */
export const useSetCategoryTypeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CategoryStatus }) => categoryTypesService.setStatus(id, status),
    onSuccess: (_result, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["category-types"] });
      toast.success(status === "active" ? "Category type activated" : "Category type deactivated");
    },
    onError: (_error, { status }) => {
      toast.error(status === "active" ? "Failed to activate category type" : "Failed to deactivate category type");
    },
  });
};

export const useDeleteCategoryType = () => {
  const { t } = useTranslation("categories");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryTypesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-types"] });
      toast.success(t("typeDeleted"));
    },
    onError: () => {
      toast.error(t("typeDeleteFailed"));
    },
  });
};
