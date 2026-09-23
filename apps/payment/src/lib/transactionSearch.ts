/**
 * The transactions list's state — and its round trip through the URL.
 *
 * Lives beside transactionStatus.ts because both are the shared vocabulary of
 * this feed rather than either role's page: the client and kita render the same
 * filters, and the client now keeps them in `?search=&status_group=&...` so a
 * reload, a Back press or a shared link reproduces the same view instead of
 * dropping the client back on an unfiltered first page.
 *
 * The field names are the API's own query-param names, so the round trip stays
 * a rename rather than a translation.
 */

export interface TransactionFilterState {
  search: string;
  /** "" | "success" | "pending" | "failed". */
  statusGroup: string;
  /** "all" | "sale" | "service". */
  type: string;
  /** "" or "YYYY-MM-DD". */
  startDate: string;
  endDate: string;
}

/** The same state as it lives in the URL. */
export interface TransactionSearch {
  search: string;
  status_group: string;
  type: string;
  start_date: string;
  end_date: string;
  page: number;
}

/** The values a URL is allowed to carry; anything else falls back to the first. */
export const TRANSACTION_STATUS_GROUPS = ["", "success", "pending", "failed"] as const;
export const TRANSACTION_TYPES = ["all", "sale", "service"] as const;

export const EMPTY_TRANSACTION_FILTERS: TransactionFilterState = {
  search: "",
  statusGroup: "",
  type: "all",
  startDate: "",
  endDate: "",
};

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** The first entry of an allowlist is that list's "unfiltered" value. */
const oneOf = (allowed: readonly string[], value: unknown): string =>
  typeof value === "string" && allowed.includes(value) ? value : allowed[0];

/**
 * A URL is user-editable, so nothing here is trusted: an unknown status or type
 * falls back to the unfiltered default (a stale bookmark must land on the page,
 * not on an error boundary), and the page is clamped so `?page=0` or `?page=abc`
 * cannot ask the server for nothing.
 */
export function parseTransactionSearch(raw: Record<string, unknown>): TransactionSearch {
  const page = Number(raw.page);

  return {
    search: text(raw.search),
    status_group: oneOf(TRANSACTION_STATUS_GROUPS, raw.status_group),
    type: oneOf(TRANSACTION_TYPES, raw.type),
    start_date: text(raw.start_date),
    end_date: text(raw.end_date),
    page: Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1,
  };
}

/** The URL's shape as the form's shape. */
export function filtersFromSearch(search: TransactionSearch): TransactionFilterState {
  return {
    search: search.search,
    statusGroup: search.status_group,
    type: search.type,
    startDate: search.start_date,
    endDate: search.end_date,
  };
}

/**
 * The form's shape as the URL's, carrying only what the patch touches — so a
 * change to one filter cannot silently blank the others.
 */
export function searchPatchFromFilters(patch: Partial<TransactionFilterState>): Partial<TransactionSearch> {
  return {
    ...(patch.search === undefined ? {} : { search: patch.search }),
    ...(patch.statusGroup === undefined ? {} : { status_group: patch.statusGroup }),
    ...(patch.type === undefined ? {} : { type: patch.type }),
    ...(patch.startDate === undefined ? {} : { start_date: patch.startDate }),
    ...(patch.endDate === undefined ? {} : { end_date: patch.endDate }),
  };
}
