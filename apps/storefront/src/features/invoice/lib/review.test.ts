import { describe, it, expect } from "vitest";

import {
  buildReviewComment,
  shouldClearPrefill,
  CHIP_KEYS,
  PREFILLED_CHIPS,
  LOW_RATING_THRESHOLD,
} from "./review";

describe("PREFILLED_CHIPS", () => {
  it("only names chips that actually exist", () => {
    for (const key of PREFILLED_CHIPS) {
      expect(CHIP_KEYS).toContain(key);
    }
  });

  it("stays a small starting nudge, not a written review", () => {
    expect(PREFILLED_CHIPS.length).toBeLessThan(CHIP_KEYS.length);
  });
});

describe("shouldClearPrefill", () => {
  it("keeps the pre-filled praise for a high score", () => {
    expect(shouldClearPrefill(5, true)).toBe(false);
    expect(shouldClearPrefill(4, true)).toBe(false);
  });

  it("drops praise the customer never chose once they score us low", () => {
    expect(shouldClearPrefill(LOW_RATING_THRESHOLD, true)).toBe(true);
    expect(shouldClearPrefill(2, true)).toBe(true);
    expect(shouldClearPrefill(1, true)).toBe(true);
  });

  it("never touches a selection the customer made themselves", () => {
    expect(shouldClearPrefill(1, false)).toBe(false);
    expect(shouldClearPrefill(5, false)).toBe(false);
  });
});

describe("buildReviewComment", () => {
  it("joins the chips with the free text", () => {
    expect(buildReviewComment(["Proses Cepat", "Harga Murah"], "mantap sekali")).toBe(
      "Proses Cepat, Harga Murah — mantap sekali",
    );
  });

  it("sends chips alone when there is no free text", () => {
    expect(buildReviewComment(["Proses Cepat"], "")).toBe("Proses Cepat");
  });

  it("sends free text alone when no chip is selected", () => {
    expect(buildReviewComment([], "lumayan")).toBe("lumayan");
  });

  it("ignores whitespace-only free text", () => {
    expect(buildReviewComment(["Recommended"], "   ")).toBe("Recommended");
  });

  it("returns undefined for a bare star rating so no empty comment is stored", () => {
    expect(buildReviewComment([], "")).toBeUndefined();
    expect(buildReviewComment([], "   ")).toBeUndefined();
  });
});
