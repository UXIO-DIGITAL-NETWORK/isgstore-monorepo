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
 * Wrapping that in one helper is the difference between one correct
 * implementation and eleven chances to return the envelope by mistake.
 */
export const unwrapPaginated = <TApiRow, TRow>(
  envelope: { data: PaginatedResponse<TApiRow> },
  mapRow: (row: TApiRow) => TRow,
): PaginatedResponse<TRow> => ({
  ...envelope.data,
  data: envelope.data.data.map(mapRow),
});

/** API booleans vs the admin's `"active" | "inactive"` status unions. */
export const toStatusUnion = (value: boolean | number): "active" | "inactive" => (value ? "active" : "inactive");

export const fromStatusUnion = (value: "active" | "inactive"): boolean => value === "active";
