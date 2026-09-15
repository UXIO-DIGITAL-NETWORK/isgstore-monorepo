import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  formatBannerDate,
  formatDate,
  formatDateTime,
  formatDateTimeSeconds,
  formatRelativeTime,
  formatWib,
  toApiDate,
  wibDayRange,
} from "./date";

describe("formatRelativeTime", () => {
  const now = new Date("2026-05-24T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats minutes ago", () => {
    expect(formatRelativeTime("2026-05-24T11:55:00.000Z")).toBe("5m Ago");
  });

  it("formats hours ago", () => {
    expect(formatRelativeTime("2026-05-24T08:00:00.000Z")).toBe("4h Ago");
  });

  it("formats days ago", () => {
    expect(formatRelativeTime("2026-05-23T08:00:00.000Z")).toBe("1d Ago");
  });
});

describe("formatBannerDate", () => {
  it("formats a date as an Indonesian welcome-banner string", () => {
    // Noon UTC keeps the calendar date stable across the host's zone.
    expect(formatBannerDate(new Date("2026-05-24T12:00:00.000Z"))).toBe("Minggu, 24 Mei 2026");
  });
});

/**
 * Literal times rather than values computed from the host's zone: the point of
 * these helpers is that the host's zone must not influence the output, and a
 * derived expectation would go on passing if it did.
 */
describe("WIB formatting", () => {
  it("renders a timestamp in WIB with the zone label", () => {
    expect(formatDateTime("2026-09-15T11:15:00.000Z")).toBe("15 Sep 2026, 18:15 WIB (GMT+7)");
  });

  it("renders seconds where they are the point", () => {
    expect(formatDateTimeSeconds("2026-09-15T11:15:07.000Z")).toBe("15 Sep 2026, 18:15:07 WIB (GMT+7)");
  });

  it("drops the label for a date-only display", () => {
    expect(formatDate("2026-08-25T03:10:00.000Z")).toBe("25 Agt 2026");
  });

  it("reads the WIB calendar day, not the UTC one", () => {
    // 18:00Z is already the next day in WIB (+7).
    expect(toApiDate(new Date("2026-09-15T18:00:00.000Z"))).toBe("2026-09-16");
  });

  it("bounds the WIB day as UTC instants", () => {
    expect(wibDayRange(new Date("2026-09-15T18:00:00.000Z"))).toEqual({
      start: "2026-09-15T17:00:00.000Z",
      end: "2026-09-16T16:59:59.999Z",
    });
  });

  it("accepts a Date as well as an ISO string", () => {
    expect(formatWib(new Date("2026-09-15T11:15:00.000Z"), "HH:mm")).toBe("18:15");
  });

  it("renders empty values as a dash rather than throwing", () => {
    expect(formatDateTime(null)).toBe("-");
    expect(formatDateTime(undefined)).toBe("-");
    expect(formatDate("")).toBe("-");
  });
});
