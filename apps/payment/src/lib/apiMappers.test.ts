import { describe, it, expect } from "vitest";

import { fromStatusUnion, toFk, toRowId, toStatusUnion, unwrapPaginated } from "@/lib/apiMappers";

describe("toRowId", () => {
  it("stringifies a numeric API id so DataTable's string constraint holds", () => {
    expect(toRowId(12)).toBe("12");
  });

  it("leaves an already-string id alone", () => {
    expect(toRowId("12")).toBe("12");
  });
});

describe("toFk", () => {
  it("converts a form's string select value back to a number for the write payload", () => {
    expect(toFk("3")).toBe(3);
  });
});

describe("toStatusUnion / fromStatusUnion", () => {
  it("round-trips the API boolean through the admin's status union", () => {
    expect(toStatusUnion(true)).toBe("active");
    expect(toStatusUnion(false)).toBe("inactive");
    expect(fromStatusUnion(toStatusUnion(true))).toBe(true);
    expect(fromStatusUnion(toStatusUnion(false))).toBe(false);
  });
});

describe("unwrapPaginated", () => {
  // The envelope nests the paginator one level deeper than the admin's
  // PaginatedResponse<T> type describes. Returning `envelope` instead of
  // `envelope.data` is the single easiest mistake to make in the service swap.
  it("reaches through the envelope and maps each row, preserving meta and links", () => {
    const envelope = {
      status: "success",
      code: 200,
      message: "ok",
      data: {
        data: [{ id: 1, name: "Diamonds" }],
        links: { first: "/x?page=1", last: "/x?page=1", prev: null, next: null },
        meta: { current_page: 1, from: 1, last_page: 1, path: "/x", per_page: 10, to: 1, total: 1 },
      },
    };

    const result = unwrapPaginated(envelope, (row) => ({ id: toRowId(row.id), label: row.name }));

    expect(result.data).toEqual([{ id: "1", label: "Diamonds" }]);
    expect(result.meta.total).toBe(1);
    expect(result.links.next).toBeNull();
  });
});
