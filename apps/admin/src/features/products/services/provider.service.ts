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
  ProviderProduct,
  ProviderProductListParams,
  SetProviderMarginInput,
} from "../types/product.type";

/**
 * The Product Provider tab's data layer — the Digiflazz price list plus the add
 * paths that turn a SKU into a real Product. Kept separate from
 * `products.service.ts` (the catalog CRUD) so each service owns one concern.
 */
const BASE = `${API_VERSION}/digiflazz`;
/** The redesigned Product Provider tab reads the managed mapping list. */
const MANAGED_BASE = `${API_VERSION}/supplier-products`;

/** The API row is the view row minus the synthetic `id` the service injects. */
type PriceListApiRow = Omit<DigiflazzPriceListItem, "id">;

/** The `/supplier-products` row shape (SupplierProductResource + product/supplier). */
interface SupplierProductApiRow {
  id: number;
  buyer_sku_code: string;
  price: number;
  is_active: boolean;
  is_price_locked: boolean;
  is_system: boolean;
  margins: { member: number | null; vip: number | null; reseller: number | null; agent: number | null };
  product?: {
    id: number;
    name: string;
    code: string;
    price_modal: number;
    price_member: number;
    price_vip: number;
    price_reseller: number;
    price_agent: number;
    status: boolean;
    category?: { id: number; name: string } | null;
  } | null;
  supplier?: { id: number; name: string; is_system: boolean } | null;
  created_at: string;
}

/** Flatten the nested API row into the view model the managed table renders. */
const toProviderProduct = (row: SupplierProductApiRow): ProviderProduct => {
  const product = row.product;
  return {
    id: String(row.id),
    buyer_sku_code: row.buyer_sku_code,
    cost: row.price,
    is_active: Boolean(row.is_active),
    is_price_locked: Boolean(row.is_price_locked),
    is_system: Boolean(row.is_system),
    supplier_name: row.supplier?.name ?? "—",
    category_name: product?.category?.name ?? "—",
    product_name: product?.name ?? "—",
    product_code: product?.code ?? "—",
    margins: {
      public: row.margins?.member ?? null,
      vip: row.margins?.vip ?? null,
      reseller: row.margins?.reseller ?? null,
      agent: row.margins?.agent ?? null,
    },
    variant: {
      id: String(product?.id ?? row.id),
      name: product?.name ?? row.buyer_sku_code,
      cost_price: product?.price_modal ?? row.price,
      prices: {
        public: product?.price_member ?? 0,
        vip: product?.price_vip ?? 0,
        reseller: product?.price_reseller ?? 0,
        agent: product?.price_agent ?? 0,
      },
      status: product?.status ? "active" : "inactive",
    },
    created_at: row.created_at,
  };
};

export const providerService = {
  priceList: async (params: DigiflazzPriceListParams = {}): Promise<PaginatedResponse<DigiflazzPriceListItem>> => {
    const { only_unmapped, ...rest } = params;
    // The API's `boolean` rule rejects the string "true" (what axios sends for a JS boolean)
    // but accepts "1"/"0". Send 1 (omit when false) so it validates on any API version.
    const query = { ...rest, ...(only_unmapped ? { only_unmapped: 1 } : {}) };
    const response: ApiResponse<PaginatedResponse<PriceListApiRow>> = await api.get(`${BASE}/price-list`, { params: query });
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

  // ── Managed provider products (redesigned Product Provider tab) ────────────

  list: async (params: ProviderProductListParams = {}): Promise<PaginatedResponse<ProviderProduct>> => {
    const query = {
      ...(params.search ? { search: params.search } : {}),
      ...(params.supplier_id ? { supplier_id: toFk(params.supplier_id) } : {}),
      ...(params.category_id ? { category_id: toFk(params.category_id) } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.mode ? { mode: params.mode } : {}),
      page: params.page,
      per_page: params.per_page,
    };
    const response: ApiResponse<PaginatedResponse<SupplierProductApiRow>> = await api.get(MANAGED_BASE, { params: query });
    return unwrapPaginated(response, toProviderProduct);
  },

  lockPrice: async (id: string, locked: boolean): Promise<void> => {
    await api.post(`${MANAGED_BASE}/${id}/lock-price`, { locked });
  },

  setMargin: async (id: string, input: SetProviderMarginInput): Promise<void> => {
    await api.post(`${MANAGED_BASE}/${id}/profit-margin`, input);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${MANAGED_BASE}/${id}`);
  },

  // ── Bulk provider actions ──────────────────────────────────────────────────

  bulkLockPrice: async (ids: string[], locked: boolean): Promise<void> => {
    await api.post(`${MANAGED_BASE}/bulk/lock-price`, { ids: ids.map(toFk), locked });
  },

  bulkSetMargin: async (ids: string[], input: SetProviderMarginInput): Promise<void> => {
    await api.post(`${MANAGED_BASE}/bulk/profit-margin`, { ids: ids.map(toFk), ...input });
  },

  bulkRemove: async (ids: string[]): Promise<{ deleted: number; skipped: { id: number; reason: string }[] }> => {
    const response: ApiResponse<{ deleted: number; skipped: { id: number; reason: string }[] }> = await api.post(
      `${MANAGED_BASE}/bulk/delete`,
      { ids: ids.map(toFk) },
    );
    return response.data;
  },
};
