import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoryServersService } from "../services/categoryServers.service";
import type { CategoryServer, CategoryServerListParams } from "../types/categoryServer.type";

export const useCategoryServerList = (params: CategoryServerListParams) =>
  useQuery({
    queryKey: ["category-servers", "list", params],
    queryFn: () => categoryServersService.list(params),
  });

export const useCategoryServer = (id?: string) =>
  useQuery({
    queryKey: ["category-servers", "detail", id],
    queryFn: () => categoryServersService.getById(id as string),
    enabled: Boolean(id),
  });

export const useCreateCategoryServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<CategoryServer, "id" | "created_at" | "updated_at">) =>
      categoryServersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-servers"] });
      toast.success("Category server created");
    },
    onError: () => {
      toast.error("Failed to create category server");
    },
  });
};

export const useUpdateCategoryServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<CategoryServer, "id" | "created_at" | "updated_at">>;
    }) => categoryServersService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-servers"] });
      toast.success("Category server updated");
    },
    onError: () => {
      toast.error("Failed to update category server");
    },
  });
};

export const useDeleteCategoryServer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryServersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category-servers"] });
      toast.success("Category server deleted");
    },
    onError: () => {
      toast.error("Failed to delete category server");
    },
  });
};
