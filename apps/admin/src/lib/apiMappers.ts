import type { PaginatedResponse } from "@/types/api.type";

/**
 * Helpers every feature service shares when mapping API rows onto the admin's
 * view types. Shared across features, so per the isolation rule they live here
 * rather than in any one feature.
 */

/**
 * The API returns numeric ids; `DataTable<TData extends {id: string}>`, every
 * column definition, every row-selection key and every `useDelete*(ids: string[])`
 * mutation are string-typed. Normalising on read keeps all of that untouched.
 *
 * Safe on the write path too: `api.put(`/v1/categories/${id}`)` interpolates a
 * numeric-looking string identically, and Laravel's route-model binding coerces
 * it back.
 */
export const toRowId = (value: number | string): string => String(value);

/**
 * The inverse, for foreign keys inside a **write payload**.
 *
 * The mapping is deliberately asymmetric: ids in a URL may be strings, but a
 * body field like `category_id` must be a real number. Laravel's `exists:` rule
 * accepts `"3"`, so a string slips through validation and only misbehaves later
 * in `Rule::unique()->ignore()` and the DTOs' strict `(int)` casts — a failure
 * that surfaces far from its cause.
 */
export const toFk = (value: number | string): number => Number(value);

/**
 * Both frontends' axios instances unwrap `response.data` to the API envelope,
 * and the API nests its paginator inside it: `{status, code, message, data:
 * {data, links, meta}}`. The admin's `PaginatedResponse<T>` models the *inner*
 * object, so every list service has to reach one level in.
 *
 * Resilient to the paginator SHAPE, because not every endpoint/deploy returns
 * the same one:
 *  - nested `{data, links, meta}` (Resource collection) → passed through;
 *  - flat Laravel paginator `{data, current_page, last_page, per_page, total,
 *    from, to, …}` (a bare `successResponse($paginator)`) → `meta` synthesised;
 *  - a plain array, or a missing body → treated as a single page.
 *
 * It ALWAYS returns a populated `meta`, so a caller reading `data.meta.total`
 * can never hit `undefined.total` — which surfaced as a full-page 503 on a list
 * page (Users) whose deployed endpoint returned the flat shape. One helper,
 * every list page.
 */
type LoosePaginator<T> = {
  data?: T[];
  links?: PaginatedResponse<T>["links"];
  meta?: PaginatedResponse<T>["meta"];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number | null;
  to?: number | null;
  path?: string;
};

export const unwrapPaginated = <TApiRow, TRow>(
  envelope: { data: LoosePaginator<TApiRow> | TApiRow[] | null | undefined },
  mapRow: (row: TApiRow) => TRow,
): PaginatedResponse<TRow> => {
  const payload = envelope.data;

  const rawRows: TApiRow[] = Array.isArray(payload) ? payload : (payload?.data ?? []);
  const rows = rawRows.map(mapRow);

  const src: LoosePaginator<TApiRow> = Array.isArray(payload) || !payload ? {} : payload;

  const meta: PaginatedResponse<TRow>["meta"] = src.meta ?? {
    current_page: src.current_page ?? 1,
    from: src.from ?? (rows.length ? 1 : null),
    last_page: src.last_page ?? 1,
    path: src.path ?? "",
    per_page: src.per_page ?? rows.length,
    to: src.to ?? (rows.length || null),
    total: src.total ?? rows.length,
  };

  const links: PaginatedResponse<TRow>["links"] = src.links ?? {
    first: null,
    last: null,
    prev: null,
    next: null,
  };

  return { data: rows, links, meta };
};

/** API booleans vs the admin's `"active" | "inactive"` status unions. */
export const toStatusUnion = (value: boolean | number): "active" | "inactive" => (value ? "active" : "inactive");

export const fromStatusUnion = (value: "active" | "inactive"): boolean => value === "active";
