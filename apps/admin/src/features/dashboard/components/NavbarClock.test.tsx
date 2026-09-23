import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { NavbarClock } from "./NavbarClock";
import { PLATFORM_TIMEZONE_LABEL } from "@/utils/date";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-02T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * The assertions are literal WIB times on purpose: a value derived from the
 * host's zone would pass on a WIB CI box while the panel rendered something
 * else on a laptop abroad, which is the whole failure this clock now prevents.
 */
describe("NavbarClock", () => {
  it("renders the WIB wall clock, with its label", () => {
    render(<NavbarClock />);

    // 10:00Z is 17:00 WIB, whatever zone the host is in.
    expect(screen.getByText(`17:00:00 ${PLATFORM_TIMEZONE_LABEL}`)).toBeInTheDocument();
  });

  it("ticks every second", () => {
    render(<NavbarClock />);

    act(() => {
      // Clear the alignment timeout, then one full interval.
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(`17:00:02 ${PLATFORM_TIMEZONE_LABEL}`)).toBeInTheDocument();
  });
});
