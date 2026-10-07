import type { ApiResponse, Paginated, Pagination, PaginationLinks } from "@/types/api.type";

/** The Laravel success envelope `{status, code, message, data}`. */
export const ok = <T>(data: T, message = "OK"): ApiResponse<T> => ({
  status: "success",
  code: 200,
  message,
  data,
});

/** Reads a positive integer param, falling back when it is absent or invalid. */
export function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Reads a trimmed string param, `""` when absent. */
export function strParam(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Wraps rows in the `{data, links, meta}` paginator the list endpoints nest. */
export function paginate<T>(
  rows: T[],
  params: Record<string, unknown>,
  path = "/",
): ApiResponse<Paginated<T>> {
  const perPage = toInt(params.per_page, 15);
  const page = toInt(params.page, 1);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const slice = rows.slice(start, start + perPage);

  const links: PaginationLinks = { first: null, last: null, prev: null, next: null };
  const meta: Pagination = {
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    total,
    from: total === 0 ? null : start + 1,
    to: total === 0 ? null : start + slice.length,
    path,
  };

  return ok({ data: slice, links, meta });
}
