import { describe, it, expect } from "vitest";

import { parseNickname } from "@/features/checkout/lib/nickname";

/**
 * The value these pin reaches the buyer twice — the account step and the
 * confirmation modal — and is persisted as `target_nickname`, so a regression
 * here is visible on the receipt long after checkout.
 */
describe("parseNickname", () => {
  it("pulls the player name out of the Digiflazz receipt line", () => {
    expect(parseNickname("User ID 63193868 Zone 2027 / Username EkaNata / Region = ID")).toBe("EkaNata");
  });

  it("handles a colon-separated label", () => {
    expect(parseNickname("Nickname: Budi")).toBe("Budi");
    expect(parseNickname("Nickname:Budi")).toBe("Budi");
    expect(parseNickname("Nama = Siti Rahayu")).toBe("Siti Rahayu");
  });

  it("leaves a plain name from a URL provider untouched", () => {
    expect(parseNickname("  Ramonezz  ")).toBe("Ramonezz");
  });

  it("returns an unrecognised shape verbatim rather than dropping it", () => {
    expect(parseNickname("EkaNata | 2027")).toBe("EkaNata | 2027");
  });

  it("does not mistake a word merely starting with 'name' for a label", () => {
    expect(parseNickname("Nameless Hero")).toBe("Nameless Hero");
  });

  it("treats no answer and an empty answer alike", () => {
    expect(parseNickname(null)).toBeNull();
    expect(parseNickname(undefined)).toBeNull();
    expect(parseNickname("   ")).toBeNull();
  });
});
