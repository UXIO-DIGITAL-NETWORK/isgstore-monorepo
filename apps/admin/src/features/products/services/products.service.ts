import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import { PRICE_RANGE_OPTIONS } from "../data/select-options.data";
import type {
  BulkCreateProductsInput,
  BulkCreateProductsResult,
  Product,
  ProductListParams,
  SelectOption,
} from "../types/product.type";

const BASE = `${API_VERSION}/products`;

interface ProductApiRow {
  id: number;
  category_id: number;
  sub_category_id: number | null;
  name: string;
  sub_name: string | null;
  code: string;
  logo_url: string | null;
  description: string | null;
  validasi_nickname: string | null;
  access: string | null;
  tag: string | null;
  price_modal: number;
  price_member: number;
  price_vip: number;
  price_reseller: number;
  price_agent: number;
  status: boolean;
  is_available: boolean;
  is_price_locked?: boolean;
  is_price_hidden?: boolean;
  price_min?: number | null;
  price_max?: number | null;
  category?: { id: number; name: string } | null;
  sub_category?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

/**
 * The API's `products` table is flat — one row per denomination, carrying its
 * own cost and four tier prices. This feature models a product as a container
 * with a `variants[]` list, but its Add form collects no prices at all, so
 * variants are display-only today.
 *
 * Each API row therefore maps to a single-variant product. `ProductPriceCell`
 * renders the same breakdown structure with one entry, so nothing changes
 * visually and no bulk-create endpoint is needed. Real multi-variant editing
 * would be its own feature.
 */
const toProduct = (row: ProductApiRow): Product => ({
  id: toRowId(row.id),
  name: row.name,
  image_url: row.logo_url ?? undefined,
  game_id: toRowId(row.category_id),
  game_name: row.category?.name ?? "",
  category_name: row.sub_category?.name ?? row.category?.name ?? "",
  code: row.code,
  sub_name: row.sub_name ?? undefined,
  sub_category_name: row.sub_category?.name ?? undefined,
  nickname_validation: row.validasi_nickname ?? undefined,
  access: row.access ?? undefined,
  tag: row.tag ?? undefined,
  description: row.description ?? undefined,
  status: row.status ? "active" : "inactive",
  is_available: Boolean(row.is_available),
  is_price_locked: Boolean(row.is_price_locked),
  is_price_hidden: Boolean(row.is_price_hidden),
  price_min: row.price_min ?? null,
  price_max: row.price_max ?? null,
  variants: [
    {
      id: toRowId(row.id),
      // An API product row *is* the denomination, so the single variant has no
      // identity of its own to borrow: the Product column already prints the
      // name, the sub-category and the code, and reusing any of them would
      // render the same string twice in one row. `sub_name` is the only field
      // the Product column does not show; without it, label the row for what
      // it is — this product's own pricing.
      name: row.sub_name ?? "Default",
      cost_price: row.price_modal,
      prices: {
        public: row.price_member,
        vip: row.price_vip,
        reseller: row.price_reseller,
        agent: row.price_agent,
      },
      status: row.status ? "active" : "inactive",
    },
  ],
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at"> & {
  category_id?: string;
  sub_category_id?: string | null;
  logo?: File | null;
};

const toFormData = (input: Partial<ProductInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);

  const categoryId = input.category_id ?? input.game_id;
  if (categoryId !== undefined) form.append("category_id", String(toFk(categoryId)));
  if (input.sub_category_id) form.append("sub_category_id", String(toFk(input.sub_category_id)));

  if (input.name !== undefined) form.append("name", input.name);
  if (input.sub_name !== undefined) form.append("sub_name", input.sub_name ?? "");
  if (input.code !== undefined) form.append("code", input.code);
  if (input.description !== undefined) form.append("description", input.description ?? "");
  if (input.nickname_validation !== undefined) form.append("validasi_nickname", input.nickname_validation ?? "");
  if (input.access !== undefined) form.append("access", input.access ?? "");
  if (input.tag !== undefined) form.append("tag", input.tag ?? "");
  if (input.status !== undefined) form.append("status", input.status === "active" ? "1" : "0");
  if (input.is_available !== undefined) form.append("is_available", input.is_available ? "1" : "0");
  if (input.logo instanceof File) form.append("logo", input.logo);

  // The API requires all five prices on every write. A product created from
  // the priceless Add form sends zeroes; an edit resends the variant it has.
  const variant = input.variants?.[0];
  form.append("price_modal", String(variant?.cost_price ?? 0));
  form.append("price_member", String(variant?.prices.public ?? 0));
  form.append("price_vip", String(variant?.prices.vip ?? 0));
  form.append("price_reseller", String(variant?.prices.reseller ?? 0));
  form.append("price_agent", String(variant?.prices.agent ?? 0));

  return form;
};

/** Maps the toolbar's named price bucket onto the API's min/max query params. */
const priceBucketParams = (bucket?: string) => {
  if (!bucket) return {};
  const range = PRICE_RANGE_OPTIONS.find((option) => option.value === bucket);
  // An unknown bucket must not silently widen the result set to everything.
  if (!range) return { min_price: Number.MAX_SAFE_INTEGER };
  return { min_price: range.min, ...(range.max !== undefined ? { max_price: range.max } : {}) };
};

export const productsService = {
  list: async (params: ProductListParams = {}): Promise<PaginatedResponse<Product>> => {
    const { price, category_id, ...rest } = params;
    const response: ApiResponse<PaginatedResponse<ProductApiRow>> = await api.get(BASE, {
      // `category_id` is a real API filter. It used to be passed as `search`,
      // which the API only matches against name/code — so picking a category
      // returned almost nothing, and because it was spread last it also wiped
      // out whatever the user had typed into the search box.
      params: {
        ...rest,
        ...priceBucketParams(price),
        ...(category_id ? { category_id: toFk(category_id) } : {}),
      },
    });
    return unwrapPaginated(response, toProduct);
  },

  getById: async (id: string): Promise<Product> => {
    const response: ApiResponse<ProductApiRow> = await api.get(`${BASE}/${id}`);
    return toProduct(response.data);
  },

  create: async (input: ProductInput): Promise<Product> => {
    const response: ApiResponse<ProductApiRow> = await api.post(BASE, toFormData(input));
    return toProduct(response.data);
  },

  update: async (id: string, input: Partial<ProductInput>): Promise<Product> => {
    // The API's update rules mark category_id, name, code and all five prices
    // required, so a partial patch would 422. Merge onto the current row first.
    const current = await productsService.getById(id);
    const response: ApiResponse<ProductApiRow> = await api.post(
      `${BASE}/${id}`,
      toFormData({ ...current, ...input }, "PUT"),
    );
    return toProduct(response.data);
  },

  /** The selection bar's "Deactive" — lifecycle only, so `is_available` is
   * left untouched and reactivating restores the previous visibility. */
  deactivate: async (id: string): Promise<void> => {
    await productsService.update(id, { status: "inactive" });
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  // ── Price controls (row + bulk) ────────────────────────────────────────────

  setPriceLimit: async (id: string, limits: { price_min: number | null; price_max: number | null }): Promise<void> => {
    await api.post(`${BASE}/${id}/price-limit`, limits);
  },

  bulkLockPrice: async (ids: string[], locked: boolean): Promise<void> => {
    await api.post(`${BASE}/bulk/lock-price`, { ids: ids.map(toFk), locked });
  },

  bulkShowPrice: async (ids: string[], hidden: boolean): Promise<void> => {
    await api.post(`${BASE}/bulk/show-price`, { ids: ids.map(toFk), hidden });
  },

  bulkDeactivate: async (ids: string[]): Promise<void> => {
    await api.post(`${BASE}/bulk/deactivate`, { ids: ids.map(toFk) });
  },

  bulkUxiotopupUpdate: async (ids: string[]): Promise<void> => {
    await api.post(`${BASE}/bulk/uxiotopup-update`, { ids: ids.map(toFk) });
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await api.post(`${BASE}/bulk/delete`, { ids: ids.map(toFk) });
  },

  // ── Add Product (Bulk) ─────────────────────────────────────────────────────

  suppliers: async (): Promise<SelectOption[]> => {
    const response: ApiResponse<PaginatedResponse<{ id: number; name: string }>> = await api.get(
      `${API_VERSION}/suppliers`,
      { params: { per_page: 100 } },
    );
    return unwrapPaginated(response, (row) => ({ value: toRowId(row.id), label: row.name })).data;
  },

  bulkCreate: async (input: BulkCreateProductsInput): Promise<BulkCreateProductsResult> => {
    const response: ApiResponse<BulkCreateProductsResult> = await api.post(`${BASE}/bulk-create`, {
      supplier_id: toFk(input.supplier_id),
      category_id: toFk(input.category_id),
      items: input.items.map((item) => ({
        code: item.code,
        name: item.name,
        cost: item.cost,
        ...(item.sub_category_id ? { sub_category_id: toFk(item.sub_category_id) } : {}),
      })),
    });
    return response.data;
  },
};
