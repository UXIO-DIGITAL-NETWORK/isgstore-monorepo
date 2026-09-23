import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatDateTime, formatNumber, wibDay } from "./format";

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

/**
 * Literal times rather than values computed from the host's zone: the point of
 * these helpers is that the host's zone must not influence the output, and a
 * derived expectation would go on passing if it did.
 */
describe("formatDate", () => {
  it("reads the date on the WIB clock", () => {
    // 11:15Z is 18:15 WIB, whatever zone the visitor's browser is in.
    expect(formatDate("2026-09-15T11:15:00.000Z", "id")).toBe("15 September 2026");
  });

  it("still honours the page locale — only the zone is pinned", () => {
    expect(formatDate("2026-09-15T11:15:00.000Z", "en")).toBe("September 15, 2026");
  });
});

describe("formatDateTime", () => {
  it("shows the WIB time with the zone label", () => {
    expect(formatDateTime("2026-09-15T11:15:00.000Z", "id")).toBe("15 Sep 2026, 18.15 WIB (GMT+7)");
  });

  it("carries the label in either language", () => {
    expect(formatDateTime("2026-09-15T11:15:00.000Z", "en")).toContain("WIB (GMT+7)");
  });
});

describe("wibDay", () => {
  it("reads the WIB calendar day, not the UTC one", () => {
    // 18:00Z is already the next day in WIB (+7).
    expect(wibDay("2026-09-15T18:00:00.000Z")).toBe("2026-09-16");
  });
});
