import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { productsService, type ProductInput } from "../services/products.service";
import type {
  BulkCreateProductsInput,
  Product,
  ProductListParams,
  SetProductMarginInput,
} from "../types/product.type";

/**
 * A product's lifecycle lives in two tables: publishing flips the product AND
 * its supplier mapping. Invalidating only `["products"]` left the pool's badges
 * describing a state that no longer existed.
 */
const invalidateProductAndPool = (queryClient: ReturnType<typeof useQueryClient>) => {
  for (const queryKey of [["products"], ["supplier-products"], ["uxiotopup", "pool-candidates"]]) {
    queryClient.invalidateQueries({ queryKey });
  }
};

/** The API's own refusal reason beats a generic failure message. */
const apiErrorMessage = (error: unknown): string | undefined =>
  isAxiosError(error) ? (error.response?.data as { message?: string } | undefined)?.message : undefined;

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

/**
 * Publish or unpublish — the row menu passes `[id]` with the direction its label
 * promised, the bulk menu passes the selection.
 *
 * The server skips per row rather than failing the batch, so a partial result is
 * a warning with the first reason attached, not an error. Same contract, and the
 * same toast shape, as the pool's bulk publish.
 */
export const useSetProductPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, published }: { ids: string[]; published: boolean }) =>
      productsService.bulkSetPublished(ids, published),
    onSuccess: (result, { published }) => {
      invalidateProductAndPool(queryClient);
      const verb = published ? "published" : "unpublished";
      const skipped = result.skipped.length;

      if (skipped > 0) {
        toast.warning(`${result.updated} ${verb}, ${skipped} skipped`, {
          description: result.skipped[0]?.reason,
        });
        return;
      }

      toast.success(result.updated === 1 ? `Product ${verb}` : `${result.updated} products ${verb}`);
    },
    onError: (_error, { ids, published }) => {
      const verb = published ? "publish" : "unpublish";
      toast.error(ids.length === 1 ? `Failed to ${verb} product` : `Failed to ${verb} products`);
    },
  });
};

/** Bring an archived product back — it returns unpublished, never straight live. */
export const useRestoreProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsService.restore(id),
    onSuccess: () => {
      invalidateProductAndPool(queryClient);
      toast.success("Product restored");
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error) ?? "Failed to restore product");
    },
  });
};

/**
 * Archive, not delete. The row survives so its order history keeps resolving —
 * `transactions.product_id` is RESTRICT, and a real delete used to 500.
 */
export const useDeleteProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => productsService.bulkDelete(ids),
    onSuccess: (_result, ids) => {
      invalidateProductAndPool(queryClient);
      toast.success(ids.length === 1 ? "Product archived" : `${ids.length} products archived`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to archive product" : "Failed to archive products");
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

/** Re-price one product from the Main Products form. */
export const useSetProductMargin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetProductMarginInput }) => productsService.setMargin(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // The margins live on the provider mapping, so that list is stale too.
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
    },
    onError: (error) => toast.error(apiErrorMessage(error) ?? "Failed to update the product margin"),
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
