import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesService, type CategoryQuickCreateInput } from "../services/categories.service";
import type { Category, CategoryListParams } from "../types/category.type";

export const useCategoryList = (params: CategoryListParams) =>
  useQuery({
    queryKey: ["categories", "list", params],
    queryFn: () => categoriesService.list(params),
  });

export const useCategory = (id?: string) =>
  useQuery({
    queryKey: ["categories", "detail", id],
    queryFn: () => categoriesService.getById(id as string),
    // Guarded: the shared add/edit form calls this with no id on the add
    // route, and an unguarded query would request `/categories/` and throw.
    enabled: Boolean(id),
  });

/**
 * Quick-create used by the Category Provider dialog, so a missing category does
 * not send an admin off to another tab mid-mapping. Same invalidation as the full
 * create, so every open category list — including the select that triggered it —
 * repopulates.
 */
export const useQuickCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CategoryQuickCreateInput) => categoriesService.quickCreate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    // No onError toast: the dialog renders the failure inline, next to the fields
    // that caused it — a duplicate code has to be fixable where it was typed.
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<Category, "id" | "created_at" | "updated_at">) => categoriesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: () => {
      toast.error("Failed to create category");
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Omit<Category, "id" | "created_at" | "updated_at">> }) =>
      categoriesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });
};

export const useSetCategoryStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      categoriesService.setStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category status updated");
    },
    onError: () => {
      toast.error("Failed to update category status");
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });
};
