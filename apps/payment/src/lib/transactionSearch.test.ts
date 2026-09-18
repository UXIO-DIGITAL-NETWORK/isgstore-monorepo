import { describe, it, expect } from "vitest";

import {
  filtersFromSearch,
  parseTransactionSearch,
  searchPatchFromFilters,
} from "./transactionSearch";

/**
 * The URL is user-editable, so these are the guards that keep a hand-typed or
 * stale query string from reaching the API as-is.
 */
describe("parseTransactionSearch", () => {
  it("keeps a complete, valid query as it was written", () => {
    expect(
      parseTransactionSearch({
        search: "INV-1",
        status_group: "failed",
        type: "service",
        start_date: "2026-08-01",
        end_date: "2026-08-31",
        page: "3",
      }),
    ).toEqual({
      search: "INV-1",
      status_group: "failed",
      type: "service",
      start_date: "2026-08-01",
      end_date: "2026-08-31",
      page: 3,
    });
  });

  it("falls back to the unfiltered feed for values it does not recognise", () => {
    const parsed = parseTransactionSearch({ status_group: "exploded", type: "refund" });

    expect(parsed.status_group).toBe("");
    expect(parsed.type).toBe("all");
  });

  /** ?page=0 or ?page=abc must not ask the server for nothing. */
  it("clamps a page that is not a usable page number", () => {
    expect(parseTransactionSearch({ page: "0" }).page).toBe(1);
    expect(parseTransactionSearch({ page: "-4" }).page).toBe(1);
    expect(parseTransactionSearch({ page: "abc" }).page).toBe(1);
    expect(parseTransactionSearch({}).page).toBe(1);
  });

  it("ignores anything that is not a string where it expects one", () => {
    expect(parseTransactionSearch({ search: 42, start_date: ["x"] })).toMatchObject({
      search: "",
      start_date: "",
    });
  });
});

describe("filtersFromSearch / searchPatchFromFilters", () => {
  it("round-trips the state through the URL's shape", () => {
    const search = parseTransactionSearch({ search: "INV-1", status_group: "pending", type: "sale", page: "2" });
    const filters = filtersFromSearch(search);

    expect(filters).toEqual({
      search: "INV-1",
      statusGroup: "pending",
      type: "sale",
      startDate: "",
      endDate: "",
    });
    expect(searchPatchFromFilters(filters)).toEqual({
      search: "INV-1",
      status_group: "pending",
      type: "sale",
      start_date: "",
      end_date: "",
    });
  });

  /** A patch carries only what it touches, so one field cannot blank the rest. */
  it("sends only the field a patch names", () => {
    expect(searchPatchFromFilters({ statusGroup: "failed" })).toEqual({ status_group: "failed" });
  });
});
