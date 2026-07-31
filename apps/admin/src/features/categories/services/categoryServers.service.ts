import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { CategoryServer, CategoryServerListParams, CategoryServerOption } from "../types/categoryServer.type";

const BASE = `${API_VERSION}/server-categories`;
const OPTIONS_BASE = `${API_VERSION}/server-category-options`;

interface ServerCategoryOptionApiRow {
  id: number;
  server_category_id: number;
  name: string;
  value: string;
}

interface ServerCategoryApiRow {
  id: number;
  category_id: number;
  name: string;
  options?: ServerCategoryOptionApiRow[];
  created_at: string;
  updated_at: string;
}

const toCategoryServer = (row: ServerCategoryApiRow): CategoryServer => ({
  id: toRowId(row.id),
  category_id: toRowId(row.category_id),
  name: row.name,
  options: (row.options ?? []).map((option) => ({ name: option.name, value: option.value })),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

type CategoryServerInput = Omit<CategoryServer, "id" | "created_at" | "updated_at">;

/**
 * Options are a nested list in this feature's model but a separate resource in
 * the API, so a write has to fan out. Existing options are deleted and the
 * submitted set recreated rather than diffed: nothing references an option's
 * id, so churning them is harmless, and a diff would be materially more code
 * for no observable difference.
 */
const replaceOptions = async (serverCategoryId: string, options: CategoryServerOption[]): Promise<void> => {
  const existing: ApiResponse<PaginatedResponse<ServerCategoryOptionApiRow>> = await api.get(OPTIONS_BASE, {
    params: { server_category_id: serverCategoryId, per_page: 100 },
  });

  await Promise.all(existing.data.data.map((option) => api.delete(`${OPTIONS_BASE}/${option.id}`)));

  await Promise.all(
    options.map((option) =>
      api.post(OPTIONS_BASE, {
        server_category_id: toFk(serverCategoryId),
        name: option.name,
        value: option.value,
      }),
    ),
  );
};

export const categoryServersService = {
  list: async (params: CategoryServerListParams = {}): Promise<PaginatedResponse<CategoryServer>> => {
    const response: ApiResponse<PaginatedResponse<ServerCategoryApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toCategoryServer);
  },

  getById: async (id: string): Promise<CategoryServer> => {
    const response: ApiResponse<ServerCategoryApiRow> = await api.get(`${BASE}/${id}`);
    return toCategoryServer(response.data);
  },

  create: async (input: CategoryServerInput): Promise<CategoryServer> => {
    const response: ApiResponse<ServerCategoryApiRow> = await api.post(BASE, {
      category_id: toFk(input.category_id),
      name: input.name,
    });

    const created = toCategoryServer(response.data);
    if (input.options.length) await replaceOptions(created.id, input.options);

    return { ...created, options: input.options };
  },

  update: async (id: string, input: Partial<CategoryServerInput>): Promise<CategoryServer> => {
    const current = await categoryServersService.getById(id);

    const response: ApiResponse<ServerCategoryApiRow> = await api.put(`${BASE}/${id}`, {
      category_id: toFk(input.category_id ?? current.category_id),
      name: input.name ?? current.name,
    });

    const updated = toCategoryServer(response.data);
    if (input.options) {
      await replaceOptions(id, input.options);
      return { ...updated, options: input.options };
    }

    return { ...updated, options: current.options };
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },
};
