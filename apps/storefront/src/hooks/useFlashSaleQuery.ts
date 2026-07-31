import { useQuery } from "@tanstack/react-query";

import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** `GET /v1/storefront/flash-sale` — `data` is null when nothing is running. */
export interface FlashSaleItemModel {
  id: number;
  product_id: number;
  name: string;
  game: string | null;
  image_url: string | null;
  sale_price: number;
  original_price: number;
  discount: number;
  stock_available: number;
  stock_total: number;
}

export interface FlashSaleModel {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  items: FlashSaleItemModel[];
}

export const useFlashSaleQuery = () =>
  useQuery({
    queryKey: ["flash-sale"],
    queryFn: async (): Promise<ApiResponse<FlashSaleModel | null>> =>
      await api.get(`${API_VERSION}/storefront/flash-sale`),
  });
