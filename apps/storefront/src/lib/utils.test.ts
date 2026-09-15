import { afterEach, describe, expect, it, vi } from "vitest";

import { daysLeft } from "./utils";

/**
 * The deadline is a WIB calendar day, so the assertions pin the count rather
 * than deriving it from the host's zone — a derived value would go on passing
 * while the storefront told a visitor one day less.
 */
describe("daysLeft", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts whole days between the WIB day and the deadline", () => {
    vi.useFakeTimers();
    // 02:00Z is 09:00 WIB on the 15th.
    vi.setSystemTime(new Date("2026-09-15T02:00:00.000Z"));

    expect(daysLeft("2026-09-18")).toBe(3);
  });

  it("has already rolled over when WIB has, even if UTC has not", () => {
    vi.useFakeTimers();
    // 18:00Z on the 15th is already the 16th in WIB, so the 18th is 2 days out.
    vi.setSystemTime(new Date("2026-09-15T18:00:00.000Z"));

    expect(daysLeft("2026-09-18")).toBe(2);
  });

  it("returns 0 for a deadline that has passed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T02:00:00.000Z"));

    expect(daysLeft("2026-09-14")).toBe(0);
  });

  it("treats the deadline day itself as 0 rather than a fraction", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T20:00:00.000Z"));

    expect(daysLeft("2026-09-16")).toBe(0);
  });
});
