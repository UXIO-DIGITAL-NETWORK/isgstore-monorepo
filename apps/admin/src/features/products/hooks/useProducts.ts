import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { productsService, type ProductInput } from "../services/products.service";
import type { BulkCreateProductsInput, Product, ProductListParams } from "../types/product.type";

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

/** Suppliers for the Add Product Bulk picker. */
export const useSuppliers = () =>
  useQuery({ queryKey: ["suppliers", "options"], queryFn: () => productsService.suppliers() });

/** Add Product (Bulk) — create many at once; the toast reports created/skipped. */
export const useBulkCreateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkCreateProductsInput) => productsService.bulkCreate(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["uxiotopup", "price-list"] });
      toast.success(
        result.skipped.length === 0
          ? `${result.created} products added`
          : `${result.created} added, ${result.skipped.length} skipped`,
      );
    },
    onError: () => toast.error("Failed to add products"),
  });
};

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
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductInput> }) => productsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });
};

/** One mutation for both deactivate paths — the row menu passes `[id]`, the
 * bulk menu passes the selection. Backed by the real bulk endpoint. */
export const useDeactivateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productsService.bulkDeactivate(ids),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(ids.length === 1 ? "Product deactivated" : `${ids.length} products deactivated`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to deactivate product" : "Failed to deactivate products");
    },
  });
};

/** One mutation for both delete paths — the row menu passes `[id]`, the bulk
 * menu passes the selection. */
export const useDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productsService.bulkDelete(ids),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(ids.length === 1 ? "Product deleted" : `${ids.length} products deleted`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to delete product" : "Failed to delete products");
    },
  });
};

/** Lock/unlock prices against the supplier sync (row `[id]` or bulk). */
export const useLockProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, locked }: { ids: string[]; locked: boolean }) => productsService.bulkLockPrice(ids, locked),
    onSuccess: (_result, { ids, locked }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${ids.length === 1 ? "Price" : `${ids.length} prices`} ${locked ? "locked" : "unlocked"}`);
    },
    onError: () => toast.error("Failed to update price lock"),
  });
};

/** Show/hide the price on the storefront (row `[id]` or bulk). */
export const useShowProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, hidden }: { ids: string[]; hidden: boolean }) => productsService.bulkShowPrice(ids, hidden),
    onSuccess: (_result, { ids, hidden }) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${ids.length === 1 ? "Price" : `${ids.length} prices`} ${hidden ? "hidden" : "shown"}`);
    },
    onError: () => toast.error("Failed to update price visibility"),
  });
};

/** Re-pull selling prices from the supplier cost (row `[id]` or bulk). */
export const useUxiotopupUpdateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productsService.bulkUxiotopupUpdate(ids),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(ids.length === 1 ? "Product updated from supplier" : `${ids.length} products updated from supplier`);
    },
    onError: () => toast.error("Failed to update from supplier"),
  });
};

/** Set a single product's min/max price window. */
export const useSetProductPriceLimit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, limits }: { id: string; limits: { price_min: number | null; price_max: number | null } }) =>
      productsService.setPriceLimit(id, limits),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Price limit updated");
    },
    onError: () => toast.error("Failed to update price limit"),
  });
};
