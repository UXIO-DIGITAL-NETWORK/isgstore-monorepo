import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriesService } from "../services/categories.service";
import type { Category, CategoryListParams } from "../types/category.type";

export const useCategoryList = (params: CategoryListParams) =>
  useQuery({
    queryKey: ["categories", "list", params],
    queryFn: () => categoriesService.list(params),
  });

export const useCategory = (id: string) =>
  useQuery({
    queryKey: ["categories", "detail", id],
    queryFn: () => categoriesService.getById(id),
  });

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
