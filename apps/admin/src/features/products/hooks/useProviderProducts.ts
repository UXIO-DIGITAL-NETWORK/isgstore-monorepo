import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { providerService } from "../services/provider.service";
import type {
  AddUxiotopupProductInput,
  BulkAddUxiotopupInput,
  ProviderProductListParams,
  SetProviderMarginInput,
  UxiotopupPriceListParams,
} from "../types/product.type";

export const useUxiotopupPriceList = (params: UxiotopupPriceListParams) =>
  useQuery({
    queryKey: ["uxiotopup", "price-list", params],
    queryFn: () => providerService.priceList(params),
  });

/** Suggested prices for the add dialog; only runs once a SKU is selected. */
export const useUxiotopupSkuPreview = (sku?: string, categoryId?: string) =>
  useQuery({
    queryKey: ["uxiotopup", "sku-preview", sku, categoryId],
    queryFn: () => providerService.skuPreview(sku as string, categoryId),
    enabled: Boolean(sku),
  });

/** Single "Add to products" — the Main Products list is invalidated too. */
export const useAddUxiotopupProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddUxiotopupProductInput) => providerService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uxiotopup", "price-list"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added to your catalog");
    },
    onError: () => {
      toast.error("Failed to add product");
    },
  });
};

// ── Managed provider products (redesigned Product Provider tab) ──────────────

export const useProviderProductList = (params: ProviderProductListParams) =>
  useQuery({
    queryKey: ["supplier-products", "list", params],
    queryFn: () => providerService.list(params),
  });

/** Toggle the price lock; a locked mapping is skipped by the daily sync. */
export const useLockProviderPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) => providerService.lockPrice(id, locked),
    onSuccess: (_result, { locked }) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      toast.success(locked ? "Price locked" : "Price unlocked");
    },
    onError: () => {
      toast.error("Failed to update price lock");
    },
  });
};

/** Set per-tier profit margins; the backend recomputes selling prices. */
export const useSetProviderMargin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SetProviderMarginInput }) => providerService.setMargin(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Profit margin updated");
    },
    onError: () => {
      toast.error("Failed to update profit margin");
    },
  });
};

/** One mutation for both delete paths — the row menu passes a single id, the
 * bulk menu passes the selection. System rows never reach here (guarded in UI
 * and rejected 403 by the API). */
export const useDeleteProviderProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => providerService.remove(id))),
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      toast.success(ids.length === 1 ? "Provider product deleted" : `${ids.length} provider products deleted`);
    },
    onError: (_error, ids) => {
      toast.error(ids.length === 1 ? "Failed to delete provider product" : "Failed to delete provider products");
    },
  });
};

/** Bulk lock/unlock across the current selection. */
export const useBulkLockProviderPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, locked }: { ids: string[]; locked: boolean }) => providerService.bulkLockPrice(ids, locked),
    onSuccess: (_result, { ids, locked }) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      toast.success(`${ids.length} ${locked ? "prices locked" : "prices unlocked"}`);
    },
    onError: () => {
      toast.error("Failed to update price locks");
    },
  });
};

/** Bulk profit margin — the backend recomputes selling prices per product. */
export const useBulkSetProviderMargin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, input }: { ids: string[]; input: SetProviderMarginInput }) =>
      providerService.bulkSetMargin(ids, input),
    onSuccess: (_result, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${ids.length} profit margins updated`);
    },
    onError: () => {
      toast.error("Failed to update profit margins");
    },
  });
};

/** Bulk delete — System rows are skipped server-side; the toast reflects it. */
export const useBulkDeleteProviderProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => providerService.bulkRemove(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
      toast.success(
        result.skipped.length === 0
          ? `${result.deleted} provider products deleted`
          : `${result.deleted} deleted, ${result.skipped.length} skipped`,
      );
    },
    onError: () => {
      toast.error("Failed to delete provider products");
    },
  });
};

/** Bulk add — the toast reports how many were created vs skipped. */
export const useBulkAddUxiotopupProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAddUxiotopupInput) => providerService.bulkAdd(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["uxiotopup", "price-list"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        result.skipped.length === 0
          ? `${result.created} products added`
          : `${result.created} added, ${result.skipped.length} skipped`,
      );
    },
    onError: () => {
      toast.error("Failed to add products");
    },
  });
};
