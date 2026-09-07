import { describe, it, expect } from "vitest";

import { computeRolePrice, impliedPercent } from "./computeRolePrice";

describe("computeRolePrice", () => {
  it("applies percent then flat, matching the backend formula", () => {
    expect(computeRolePrice(5100, 20)).toBe(6120);
    expect(computeRolePrice(5100, 20, 500)).toBe(6620);
    expect(computeRolePrice(1000, 12.5)).toBe(1125);
  });

  it("returns the flat markup when cost is zero or invalid", () => {
    expect(computeRolePrice(0, 20, 300)).toBe(300);
    expect(computeRolePrice(Number.NaN, 20)).toBe(0);
  });
});

describe("impliedPercent", () => {
  it("inverts a price back to its markup over cost", () => {
    expect(impliedPercent(5100, 6120)).toBe(20);
    expect(impliedPercent(0, 6120)).toBe(0);
  });
});
