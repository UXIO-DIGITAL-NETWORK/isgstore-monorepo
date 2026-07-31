import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { FlashSale, MarketingListParams } from "../types/marketing.type";

const BASE = `${API_VERSION}/flash-sales`;

interface FlashSaleItemApiRow {
  id: number;
  product_id: number;
  product_name: string | null;
  sale_price: number;
  original_price: number;
  stock_total: number;
  stock_sold: number;
  stock_available: number;
  sort_order: number;
}

interface FlashSaleApiRow {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_running: boolean;
  items?: FlashSaleItemApiRow[];
  created_at: string;
  updated_at: string;
}

const toFlashSale = (row: FlashSaleApiRow): FlashSale => ({
  id: toRowId(row.id),
  name: row.name,
  starts_at: row.starts_at,
  ends_at: row.ends_at,
  is_active: Boolean(row.is_active),
  is_running: Boolean(row.is_running),
  items: (row.items ?? []).map((item) => ({
    id: toRowId(item.id),
    product_id: toRowId(item.product_id),
    product_name: item.product_name ?? "",
    sale_price: item.sale_price,
    original_price: item.original_price,
    stock_total: item.stock_total,
    stock_sold: item.stock_sold,
    stock_available: item.stock_available,
    sort_order: item.sort_order,
  })),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export interface FlashSaleInput {
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  /** Omitting this leaves the line-up alone; an empty array clears it. */
  items?: { product_id: string; sale_price: number; stock_total: number; sort_order?: number }[];
}

const toPayload = (input: Partial<FlashSaleInput>) => ({
  ...input,
  ...(input.items
    ? {
        items: input.items.map((item, index) => ({
          product_id: toFk(item.product_id),
          sale_price: item.sale_price,
          stock_total: item.stock_total,
          sort_order: item.sort_order ?? index,
        })),
      }
    : {}),
});

export const flashSalesService = {
  list: async (params: MarketingListParams = {}): Promise<PaginatedResponse<FlashSale>> => {
    const response: ApiResponse<PaginatedResponse<FlashSaleApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toFlashSale);
  },
  getById: async (id: string): Promise<FlashSale> => {
    const response: ApiResponse<FlashSaleApiRow> = await api.get(`${BASE}/${id}`);
    return toFlashSale(response.data);
  },
  create: async (input: FlashSaleInput): Promise<FlashSale> => {
    const response: ApiResponse<FlashSaleApiRow> = await api.post(BASE, toPayload(input));
    return toFlashSale(response.data);
  },
  update: async (id: string, input: Partial<FlashSaleInput>): Promise<FlashSale> => {
    const response: ApiResponse<FlashSaleApiRow> = await api.put(`${BASE}/${id}`, toPayload(input));
    return toFlashSale(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
