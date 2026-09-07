import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { formatRelativeTime, formatBannerDate } from "./date";

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
  it("formats a date as a welcome-banner string", () => {
    // Noon UTC keeps the calendar date stable across the CI runner's local
    // timezone (avoids midnight-boundary rollover flakiness).
    expect(formatBannerDate(new Date("2026-05-24T12:00:00.000Z"))).toBe("It's Sunday, May 24, 2026!");
  });
});
