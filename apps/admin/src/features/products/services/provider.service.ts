import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type {
  AddDigiflazzProductInput,
  BulkAddDigiflazzInput,
  BulkAddDigiflazzResult,
  DigiflazzPriceListItem,
  DigiflazzPriceListParams,
  DigiflazzSkuPreview,
  DigiflazzType,
} from "../types/product.type";

/**
 * The Product Provider tab's data layer — the Digiflazz price list plus the add
 * paths that turn a SKU into a real Product. Kept separate from
 * `products.service.ts` (the catalog CRUD) so each service owns one concern.
 */
const BASE = `${API_VERSION}/digiflazz`;

/** The API row is the view row minus the synthetic `id` the service injects. */
type PriceListApiRow = Omit<DigiflazzPriceListItem, "id">;

export const providerService = {
  priceList: async (params: DigiflazzPriceListParams = {}): Promise<PaginatedResponse<DigiflazzPriceListItem>> => {
    const response: ApiResponse<PaginatedResponse<PriceListApiRow>> = await api.get(`${BASE}/price-list`, { params });
    return unwrapPaginated(response, (row) => ({ ...row, id: row.buyer_sku_code }));
  },

  /** Suggested prices for the add dialog — refetched when the category changes. */
  skuPreview: async (
    buyerSkuCode: string,
    type: DigiflazzType,
    categoryId?: string,
  ): Promise<DigiflazzSkuPreview> => {
    const response: ApiResponse<DigiflazzSkuPreview> = await api.get(`${BASE}/sku-preview`, {
      params: { buyer_sku_code: buyerSkuCode, type, ...(categoryId ? { category_id: toFk(categoryId) } : {}) },
    });
    return response.data;
  },

  /** Single add — the admin's four tier prices are sent explicitly. */
  add: async (input: AddDigiflazzProductInput): Promise<void> => {
    await api.post(`${BASE}/products`, {
      buyer_sku_code: input.buyer_sku_code,
      type: input.type,
      category_id: toFk(input.category_id),
      sub_category_id: input.sub_category_id ? toFk(input.sub_category_id) : null,
      ...(input.name ? { name: input.name } : {}),
      price_member: input.price_member,
      price_vip: input.price_vip,
      price_reseller: input.price_reseller,
      price_agent: input.price_agent,
      status: input.status,
    });
  },

  /** Bulk add — no per-SKU prices; the backend derives them from pricing rules. */
  bulkAdd: async (input: BulkAddDigiflazzInput): Promise<BulkAddDigiflazzResult> => {
    const response: ApiResponse<BulkAddDigiflazzResult> = await api.post(`${BASE}/products/bulk`, {
      type: input.type,
      category_id: toFk(input.category_id),
      sub_category_id: input.sub_category_id ? toFk(input.sub_category_id) : null,
      status: input.status,
      buyer_sku_codes: input.buyer_sku_codes,
    });
    return response.data;
  },
};
