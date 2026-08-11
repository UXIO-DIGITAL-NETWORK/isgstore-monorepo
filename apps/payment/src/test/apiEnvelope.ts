/**
 * Builders for the API response shapes service tests assert against.
 *
 * The axios instance unwraps `response.data`, so a service receives the
 * envelope itself — and list endpoints nest the paginator inside it. Getting
 * that nesting right in every test by hand is the easiest place to write a
 * test that passes against a shape the API never sends.
 */
export const envelope = <T>(data: T) => ({ status: "success" as const, code: 200, message: "ok", data });

export const paginated = <T>(rows: T[], overrides: { per_page?: number; total?: number; current_page?: number } = {}) =>
  envelope({
    data: rows,
    links: { first: "/x?page=1", last: "/x?page=1", prev: null, next: null },
    meta: {
      current_page: overrides.current_page ?? 1,
      from: rows.length ? 1 : null,
      last_page: 1,
      path: "/x",
      per_page: overrides.per_page ?? 10,
      to: rows.length || null,
      total: overrides.total ?? rows.length,
    },
  });
