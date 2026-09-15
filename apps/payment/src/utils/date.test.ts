import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatDate, formatDateTime, formatRelativeTime, formatWib } from "./date";

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

/**
 * Literal times rather than values computed from the host's zone: the point of
 * these helpers is that the host's zone must not influence the output, and a
 * derived expectation would go on passing if it did.
 */
describe("WIB formatting", () => {
  it("renders a timestamp in WIB with the zone label", () => {
    expect(formatDateTime("2026-09-15T11:15:00.000Z")).toBe("15 Sep 2026, 18:15 WIB (GMT+7)");
  });

  it("drops the label for a date-only display", () => {
    expect(formatDate("2026-08-25T03:10:00.000Z")).toBe("25 Agt 2026");
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
