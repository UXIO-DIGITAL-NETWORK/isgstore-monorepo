import { describe, it, expect } from "vitest";
import { swapLocaleInPath } from "./locale";

/**
 * Switching language without losing the page.
 *
 * The dropdown used to navigate to the locale root, so changing language on
 * `/id/checkout/INV-123` dropped the buyer on `/en` — mid-purchase, with the
 * invoice they were paying nowhere on screen. `CLAUDE.md` described replacing
 * the first segment all along; the code simply did something else.
 */
describe("swapLocaleInPath", () => {
  it("keeps the page and swaps only the locale segment", () => {
    expect(swapLocaleInPath("/id/checkout/INV-123", "en")).toBe("/en/checkout/INV-123");
    expect(swapLocaleInPath("/en/games/mobile-legends", "id")).toBe("/id/games/mobile-legends");
  });

  it("keeps the query string and hash", () => {
    // The refund page is reached as `/id/refund?invoice=…`; dropping the query
    // would land the buyer on an empty form.
    expect(swapLocaleInPath("/id/refund?invoice=INV-9#form", "en")).toBe("/en/refund?invoice=INV-9#form");
  });

  it("handles the locale root itself", () => {
    expect(swapLocaleInPath("/id", "en")).toBe("/en");
    expect(swapLocaleInPath("/id/", "en")).toBe("/en");
  });

  it("prefixes a path that carries no locale yet", () => {
    // Reachable before the `$locale` route has redirected, and on any link
    // someone typed by hand.
    expect(swapLocaleInPath("/checkout/INV-1", "en")).toBe("/en/checkout/INV-1");
    expect(swapLocaleInPath("/", "en")).toBe("/en");
    expect(swapLocaleInPath("", "en")).toBe("/en");
  });

  it("does not mistake a page for a locale", () => {
    // "invoice" is not a locale, so it must be kept as part of the path rather
    // than replaced — the bug this guards against would eat the first segment
    // of every unprefixed URL.
    expect(swapLocaleInPath("/invoice/INV-1", "id")).toBe("/id/invoice/INV-1");
  });
});
