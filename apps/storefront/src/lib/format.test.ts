import { describe, expect, it } from "vitest";

import { formatCurrency, formatNumber } from "./format";

describe("formatCurrency", () => {
  it("writes rupiah as rupiah in every language", () => {
    // The bug this pins: routing currency through the page locale made every
    // /en/ page render "IDR 15,231" — Intl swaps to the ISO code for a currency
    // foreign to the formatting locale. The store prices in rupiah regardless.
    expect(formatCurrency(15231, "id")).toBe("Rp 15.231");
    expect(formatCurrency(15231, "en")).toBe("Rp 15.231");
  });

  it("uses Indonesian separators and no decimals", () => {
    expect(formatCurrency(1500000)).toBe("Rp 1.500.000");
    expect(formatCurrency(0)).toBe("Rp 0");
  });

  it("uses a plain space, not a non-breaking one", () => {
    // Matches the other two apps and copies predictably.
    expect(formatCurrency(1000)).not.toContain(" ");
  });

  it("shows an absence rather than RpNaN", () => {
    // Intl formats `undefined` happily, so a field the API stopped sending
    // would otherwise reach the screen looking like a price.
    expect(formatCurrency(Number.NaN)).toBe("-");
    expect(formatCurrency(undefined as unknown as number)).toBe("-");
  });
});

describe("formatNumber", () => {
  it("still honours the locale — only currency is pinned", () => {
    expect(formatNumber(1500, "id")).toBe("1.500");
    expect(formatNumber(1500, "en")).toBe("1,500");
  });
});
