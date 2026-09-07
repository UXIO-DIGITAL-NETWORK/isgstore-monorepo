import { describe, expect, it } from "vitest";

import { displayTiers, tierColor, tierGridTemplate, tierPriceLabel } from "./tierColumns";
import type { PriceListTier } from "@/features/price-list/types/priceList.type";

const tier = (overrides: Partial<PriceListTier> = {}): PriceListTier => ({
  planId: 1,
  planCode: "platinum",
  planName: "Platinum",
  isDefault: false,
  isHidden: false,
  price: 23000,
  ...overrides,
});

describe("tierGridTemplate", () => {
  it("grows a column per tier", () => {
    // Three fixed columns + N tiers + status. Adding a plan must not need a
    // frontend release, which is the whole point of not hardcoding six.
    expect(tierGridTemplate(2).split(" ")).toHaveLength(6);
    expect(tierGridTemplate(4).split(" ")).toHaveLength(8);
  });

  it("still renders a usable table with no tiers at all", () => {
    expect(tierGridTemplate(0).split(" ")).toHaveLength(4);
  });
});

describe("tierColor", () => {
  it("always ends on the top-tier amber", () => {
    expect(tierColor(2, 3)).toBe("#E5A000");
    expect(tierColor(0, 1)).toBe("#E5A000");
  });

  it("starts on the member azure when there is a ladder", () => {
    expect(tierColor(0, 3)).toBe("#3B82F6");
  });
});

describe("tierPriceLabel", () => {
  const format = (value: number) => `Rp ${value}`;

  it("formats a visible price", () => {
    expect(tierPriceLabel(tier(), format, "Khusus member")).toBe("Rp 23000");
  });

  it("withholds the highest tier's price", () => {
    // It is the reason to subscribe — publishing it gives away the incentive.
    expect(tierPriceLabel(tier({ isHidden: true, price: null }), format, "Khusus member")).toBe("Khusus member");
  });

  it("withholds a null price even when the flag is not set", () => {
    expect(tierPriceLabel(tier({ price: null }), format, "Khusus member")).toBe("Khusus member");
  });
});

describe("displayTiers", () => {
  it("drops the default plan, which is already the Harga Normal column", () => {
    const tiers = [tier({ planId: 1, isDefault: true }), tier({ planId: 2 }), tier({ planId: 3 })];

    expect(displayTiers(tiers).map((t) => t.planId)).toEqual([2, 3]);
  });
});
