import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { fromStatusUnion, toFk, toRowId, toStatusUnion, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { Category, CategoryListParams, CategoryOrderFormField } from "../types/category.type";

const BASE = `${API_VERSION}/categories`;

/**
 * The API stores the order form as `{fields, customer_no_template}`, while this
 * feature models just the field list. `customer_no_template` is what builds the
 * identifier sent to the upstream supplier, so it must survive an edit — losing
 * it makes paid orders fail at fulfilment, long after the customer has been
 * charged. It is therefore read back and resent verbatim on every write.
 */
interface OrderFormSchema {
  fields?: CategoryOrderFormField[];
  customer_no_template?: string;
}

interface CategoryApiRow {
  id: number;
  type_id: number;
  name: string;
  sub_name: string | null;
  code: string;
  slug: string | null;
  uid_parser: string | null;
  validasi_nickname: string | null;
  nickname_check_enabled?: boolean;
  region: string | null;
  logo_url: string | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  description: string | null;
  status: boolean;
  order_form_fields: OrderFormSchema | CategoryOrderFormField[] | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  meta_keywords: string[] | null;
  meta_robots: string | null;
  type?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}

/** Tolerates both the wrapped schema and a bare array, since older rows predate the wrapper. */
const readFields = (raw: CategoryApiRow["order_form_fields"]): CategoryOrderFormField[] =>
  Array.isArray(raw) ? raw : (raw?.fields ?? []);

const readTemplate = (raw: CategoryApiRow["order_form_fields"]): string | undefined =>
  Array.isArray(raw) ? undefined : raw?.customer_no_template;

const toCategory = (row: CategoryApiRow): Category => ({
  id: toRowId(row.id),
  // `type_id` drives the form's Type select and the write; `type` is the name
  // the list column shows.
  type_id: toRowId(row.type?.id ?? row.type_id),
  type: row.type?.name ?? String(row.type_id),
  uid_parser: row.uid_parser ?? "",
  name: row.name,
  sub_name: row.sub_name ?? undefined,
  account_nickname_validation: row.validasi_nickname ?? undefined,
  account_nickname_check_enabled: row.nickname_check_enabled ?? true,
  region: row.region ?? undefined,
  code: row.code,
  slug: row.slug ?? "",
  status: toStatusUnion(row.status),
  order_form_fields: readFields(row.order_form_fields),
  logo_url: row.logo_url ?? undefined,
  description: row.description ?? undefined,
  meta_title: row.meta_title ?? undefined,
  meta_description: row.meta_description ?? undefined,
  og_image_url: row.og_image_url ?? undefined,
  meta_keywords: row.meta_keywords ?? undefined,
  meta_robots: row.meta_robots ?? undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type CategoryInput = Omit<Category, "id" | "created_at" | "updated_at"> & {
  /** The form's Category Type select. `type` is the display name only. */
  type_id?: string;
  logo?: File | null;
  og_image?: File | null;
  thumbnail?: File | null;
  banner?: File | null;
};

/** The minimum `POST /v1/categories` accepts: type, name, code (+ optional slug). */
export interface CategoryQuickCreateInput {
  type_id: string;
  name: string;
  code: string;
  slug?: string;
}

const appendIf = (form: FormData, key: string, value: string | undefined | null) => {
  if (value !== undefined && value !== null) form.append(key, value);
};

const toFormData = (
  input: Partial<CategoryInput>,
  opts: { method?: "PUT"; preservedTemplate?: string } = {},
): FormData => {
  const form = new FormData();
  if (opts.method) form.append("_method", opts.method);

  if (input.type_id !== undefined) form.append("type_id", String(toFk(input.type_id)));
  appendIf(form, "name", input.name);
  appendIf(form, "sub_name", input.sub_name);
  appendIf(form, "code", input.code);
  appendIf(form, "slug", input.slug);
  appendIf(form, "validasi_nickname", input.account_nickname_validation);
  if (input.account_nickname_check_enabled !== undefined) {
    form.append("nickname_check_enabled", input.account_nickname_check_enabled ? "1" : "0");
  }
  appendIf(form, "region", input.region);
  appendIf(form, "description", input.description);
  appendIf(form, "meta_title", input.meta_title);
  appendIf(form, "meta_description", input.meta_description);
  appendIf(form, "meta_robots", input.meta_robots);
  if (input.status !== undefined) form.append("status", fromStatusUnion(input.status) ? "1" : "0");

  input.meta_keywords?.forEach((keyword) => form.append("meta_keywords[]", keyword));

  if (input.order_form_fields !== undefined) {
    form.append(
      "order_form_fields",
      JSON.stringify({
        fields: input.order_form_fields,
        ...(opts.preservedTemplate ? { customer_no_template: opts.preservedTemplate } : {}),
      }),
    );
  }

  for (const key of ["logo", "og_image", "thumbnail", "banner"] as const) {
    const file = input[key];
    if (file instanceof File) form.append(key, file);
  }

  return form;
};

export const categoriesService = {
  list: async (params: CategoryListParams = {}): Promise<PaginatedResponse<Category>> => {
    const response: ApiResponse<PaginatedResponse<CategoryApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toCategory);
  },

  getById: async (id: string): Promise<Category> => {
    const response: ApiResponse<CategoryApiRow> = await api.get(`${BASE}/${id}`);
    return toCategory(response.data);
  },

  /**
   * Create a category from the minimum the API actually requires.
   *
   * `CategoryInput` is `Omit<Category, ...>`, so it demands `type`, `uid_parser`,
   * `order_form_fields` and the rest — fields the quick-create form does not model,
   * which is why the full dialog resorts to an `as never` cast. Narrowing the input
   * here means the second caller does not repeat that cast, and `toFormData` only
   * appends what is present, so nothing empty is sent.
   */
  quickCreate: async (input: CategoryQuickCreateInput): Promise<Category> => {
    const response: ApiResponse<CategoryApiRow> = await api.post(
      BASE,
      toFormData({
        type_id: input.type_id,
        name: input.name,
        code: input.code,
        slug: input.slug,
        // `status` is `required|boolean` server-side; a quick-created category is
        // meant to be mapped straight away, so it starts active.
        status: "active",
      }),
    );
    return toCategory(response.data);
  },

  create: async (input: CategoryInput): Promise<Category> => {
    const response: ApiResponse<CategoryApiRow> = await api.post(BASE, toFormData(input));
    return toCategory(response.data);
  },

  update: async (id: string, input: Partial<CategoryInput>): Promise<Category> => {
    // Read first purely to carry `customer_no_template` across the write.
    const existing: ApiResponse<CategoryApiRow> = await api.get(`${BASE}/${id}`);

    const response: ApiResponse<CategoryApiRow> = await api.post(
      `${BASE}/${id}`,
      toFormData(input, { method: "PUT", preservedTemplate: readTemplate(existing.data.order_form_fields) }),
    );
    return toCategory(response.data);
  },

  /**
   * Status-only toggle. Dedicated endpoint because `update` is a full replace —
   * a status-only payload there 422s on the required `type_id`/`name`/`code` and
   * would wipe every other column. JSON body: no file, so no FormData.
   */
  setStatus: async (id: string, status: "active" | "inactive"): Promise<Category> => {
    const response: ApiResponse<CategoryApiRow> = await api.post(`${BASE}/${id}/status`, {
      status: fromStatusUnion(status),
    });
    return toCategory(response.data);
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
