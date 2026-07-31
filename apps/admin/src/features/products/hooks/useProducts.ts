import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsService } from "../services/products.service";
import type { Product, ProductListParams } from "../types/product.type";

export const useProductList = (params: ProductListParams) =>
  useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => productsService.list(params),
  });

export const useProduct = (id?: string) =>
  useQuery({
    queryKey: ["products", "detail", id],
    queryFn: () => productsService.getById(id as string),
    enabled: Boolean(id),
  });

/** Add Main Products (§4.6). Same shape as `useCreateCategory`. */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<Product, "id" | "created_at" | "updated_at">) => productsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
    },
    onError: () => {
      toast.error("Failed to create product");
    },
  });
};

/** The selection bar's "Deactive (N)" — same bulk shape as the delete path. */
export const useDeactivateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => productsService.deactivate(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(ids.length === 1 ? "Product deactivated" : `${ids.length} products deactivated`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to deactivate product" : "Failed to deactivate products");
    },
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * toolbar's "Delete (N)" passes the selection. Same shape as
 * `useDeleteCategoryProviders`, the other list with row selection. */
export const useDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => productsService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(ids.length === 1 ? "Product deleted" : `${ids.length} products deleted`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to delete product" : "Failed to delete products");
    },
  });
};
