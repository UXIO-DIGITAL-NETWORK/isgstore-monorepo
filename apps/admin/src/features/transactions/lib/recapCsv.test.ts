import { describe, it, expect } from "vitest";

import { recapToCsv } from "./recapCsv";

describe("recapToCsv", () => {
  it("serialises rows plus a totals footer and quotes cells with commas", () => {
    const csv = recapToCsv({
      period: "daily",
      generated_at: "2026-07-01T00:00:00.000Z",
      rows: [
        { label: "Mobile Legends", count: 2, revenue: 1000 },
        { label: "Free Fire, Global", count: 3, revenue: 2000 },
      ],
      totals: { count: 5, revenue: 3000 },
    });

    expect(csv).toBe(
      ["Label,Count,Revenue", "Mobile Legends,2,1000", '"Free Fire, Global",3,2000', "Total,5,3000"].join("\n"),
    );
  });
});
