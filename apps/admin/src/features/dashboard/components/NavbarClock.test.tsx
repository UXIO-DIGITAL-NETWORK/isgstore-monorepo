import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { makeUser } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { NavbarClock } from "./NavbarClock";

/** Derived, never hardcoded: a literal would depend on the CI host's zone. */
const expected = (timeZone: string, at: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
    timeZone,
  }).format(at);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-02T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  useAuthStore.setState({ user: null });
});

describe("NavbarClock", () => {
  it("renders the stored timezone's wall clock, not the browser's", () => {
    useAuthStore.setState({ user: makeUser({ timezone: "Asia/Jakarta" }) });
    render(<NavbarClock />);

    // 10:00Z is 17:00 WIB.
    expect(screen.getByText(expected("Asia/Jakarta", new Date("2026-09-02T10:00:00Z")))).toBeInTheDocument();
  });

  it("ticks every second", () => {
    useAuthStore.setState({ user: makeUser({ timezone: "Asia/Jakarta" }) });
    render(<NavbarClock />);

    act(() => {
      // Clear the alignment timeout, then one full interval.
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText(expected("Asia/Jakarta", new Date("2026-09-02T10:00:02Z")))).toBeInTheDocument();
  });

  it("falls back to UTC rather than crashing on an unparseable stored timezone", () => {
    useAuthStore.setState({ user: makeUser({ timezone: "WIB" }) });
    render(<NavbarClock />);

    expect(screen.getByText(expected("UTC", new Date("2026-09-02T10:00:00Z")))).toBeInTheDocument();
  });

  it("renders nothing when there is no signed-in user", () => {
    useAuthStore.setState({ user: null });
    const { container } = render(<NavbarClock />);

    expect(container).toBeEmptyDOMElement();
  });
});
