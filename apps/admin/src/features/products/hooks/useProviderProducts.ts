import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { providerService } from "../services/provider.service";
import type {
  AddDigiflazzProductInput,
  BulkAddDigiflazzInput,
  DigiflazzPriceListParams,
  DigiflazzType,
} from "../types/product.type";

export const useDigiflazzPriceList = (params: DigiflazzPriceListParams) =>
  useQuery({
    queryKey: ["digiflazz", "price-list", params],
    queryFn: () => providerService.priceList(params),
  });

/** Suggested prices for the add dialog; only runs once a SKU is selected. */
export const useDigiflazzSkuPreview = (sku?: string, type: DigiflazzType = "prepaid", categoryId?: string) =>
  useQuery({
    queryKey: ["digiflazz", "sku-preview", sku, type, categoryId],
    queryFn: () => providerService.skuPreview(sku as string, type, categoryId),
    enabled: Boolean(sku),
  });

/** Single "Add to products" — the Main Products list is invalidated too. */
export const useAddDigiflazzProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddDigiflazzProductInput) => providerService.add(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digiflazz", "price-list"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product added to your catalog");
    },
    onError: () => {
      toast.error("Failed to add product");
    },
  });
};

/** Bulk add — the toast reports how many were created vs skipped. */
export const useBulkAddDigiflazzProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAddDigiflazzInput) => providerService.bulkAdd(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["digiflazz", "price-list"] });
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
