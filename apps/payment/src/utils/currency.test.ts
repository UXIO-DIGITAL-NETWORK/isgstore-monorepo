import { describe, it, expect } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formats a number as Indonesian Rupiah with two decimals", () => {
    expect(formatCurrency(15231.89)).toBe("Rp 15.231,89");
  });

  it("formats a whole number with trailing decimals", () => {
    expect(formatCurrency(0)).toBe("Rp 0,00");
  });
});
