import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryProvidersService } from "../services/categoryProviders.service";
import type { CategoryProvider, CategoryProviderListParams } from "../types/categoryProvider.type";

export const useCategoryProviderList = (params: CategoryProviderListParams) =>
  useQuery({
    queryKey: ["category-providers", "list", params],
    queryFn: () => categoryProvidersService.list(params),
  });

export const useCategoryProvider = (id?: string) =>
  useQuery({
    queryKey: ["category-providers", "detail", id],
    queryFn: () => categoryProvidersService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateCategoryProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CategoryProvider, "id" | "created_at" | "updated_at">) =>
      categoryProvidersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-providers"] });
      toast.success("Category provider created");
    },
    onError: () => {
      toast.error("Failed to create category provider");
    },
  });
};

export const useUpdateCategoryProvider = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<CategoryProvider, "id" | "created_at" | "updated_at">>;
    }) => categoryProvidersService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-providers"] });
      toast.success("Category provider updated");
    },
    onError: () => {
      toast.error("Failed to update category provider");
    },
  });
};

/** One mutation for both delete paths (§4.5 line 245) — the row menu passes a
 * single id, the toolbar's "Delete (N)" passes the selection. Same shape as
 * `useDeleteSubCategories`, the other tab with row selection. */
export const useDeleteCategoryProviders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => categoryProvidersService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["category-providers"] });
      toast.success(ids.length === 1 ? "Category provider deleted" : `${ids.length} category providers deleted`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to delete category provider" : "Failed to delete category providers");
    },
  });
};
