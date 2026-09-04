import { describe, it, expect } from "vitest";

import { calculateAdminFee, toDiamondPackages, toGameInfo } from "@/features/checkout/lib/mappers";
import type { GameDetailModel } from "@/types/models/game.model";
import type { GameProductsResponse } from "@/types/models/product.model";

/**
 * Product and game names reach the UI through these mappers. A wrong field
 * name here renders an empty string rather than throwing, so the failure is
 * invisible without a test — which is exactly the case these pin.
 */
const game = (over: Partial<GameDetailModel> = {}): GameDetailModel =>
  ({
    id: 1,
    name: "Mobile Legends",
    sub_name: "Moonton",
    region: "Indonesia",
    slug: "mobile-legends",
    code: "MLBB",
    logo_url: "http://localhost/storage/logo.png",
    thumbnail_url: "http://localhost/storage/thumb.png",
    banner_url: null,
    initials: "ML",
    description: null,
    order_form_fields: [],
    meta: { title: null, description: null, keywords: [], robots: null, og_image_url: null },
    ...over,
  }) as GameDetailModel;

const products = (over: Partial<GameProductsResponse> = {}): GameProductsResponse => ({
  groups: ["Diamond"],
  products: [
    { id: 9, name: "100 Diamonds", code: "ML100", price: 24000, group: "Diamond", sub_category_id: 3, amount: 100, point_percent: 1, point_flat: 5 },
  ],
  ...over,
});

describe("toGameInfo", () => {
  it("carries the game name through to the checkout header", () => {
    const result = toGameInfo(game());

    expect(result.name).toBe("Mobile Legends");
    expect(result.region).toBe("Indonesia");
    expect(result.slug).toBe("mobile-legends");
  });

  it("falls back to empty strings rather than undefined when optional fields are absent", () => {
    const result = toGameInfo(game({ sub_name: null, region: null }));

    expect(result.publisher).toBe("");
    expect(result.region).toBe("");
  });
});

describe("toDiamondPackages", () => {
  it("carries the product name through to the package card", () => {
    const [pkg] = toDiamondPackages(products());

    expect(pkg.name).toBe("100 Diamonds");
    expect(pkg.price).toBe(24000);
    expect(pkg.amount).toBe(100);
    // The id the checkout request is built from — not the display id.
    expect(pkg.productId).toBe(9);
  });

  it("groups by the API's sub-category label, which drives the package tabs", () => {
    const [pkg] = toDiamondPackages(products());

    expect(pkg.category).toBe("Diamond");
  });

  /**
   * `amount` is parsed from the name server-side and is null when the name
   * carries no digits ("Weekly Pass"). The card shows the name either way, so
   * a missing amount must not blank the row.
   */
  it("treats a product with no parsed amount as zero rather than dropping it", () => {
    const [pkg] = toDiamondPackages(
      products({
        products: [
          { id: 12, name: "Weekly Pass", code: "WP", price: 27000, group: "Pass", sub_category_id: 4, amount: null, point_percent: 0, point_flat: 0 },
        ],
      }),
    );

    expect(pkg.name).toBe("Weekly Pass");
    expect(pkg.amount).toBe(0);
  });

  it("carries the point earning rule through for the summary to quote", () => {
    const [pkg] = toDiamondPackages(products());

    expect(pkg.pointPercent).toBe(1);
    expect(pkg.pointFlat).toBe(5);
  });
});

/**
 * `calculateAdminFee` duplicates CheckoutAction's maths so the summary can show
 * the total before the order is submitted. A drift here quotes the customer a
 * price the backend will not charge, which no other test would catch.
 */
describe("calculateAdminFee", () => {
  it("adds the channel's flat fee", () => {
    expect(calculateAdminFee({ feeFlat: 2500, feePercent: 0 }, 50_000)).toBe(2500);
  });

  it("adds the channel's percentage of the price, rounded", () => {
    expect(calculateAdminFee({ feeFlat: 0, feePercent: 0.7 }, 50_000)).toBe(350);
    expect(calculateAdminFee({ feeFlat: 0, feePercent: 1.5 }, 33_333)).toBe(500);
  });

  it("adds flat and percent together", () => {
    expect(calculateAdminFee({ feeFlat: 1000, feePercent: 2 }, 50_000)).toBe(2000);
  });

  /** Mirrors the backend's `max(0, min(100, ...))` clamp on fee_percent. */
  it("clamps the percentage to 0..100", () => {
    expect(calculateAdminFee({ feeFlat: 0, feePercent: -5 }, 50_000)).toBe(0);
    expect(calculateAdminFee({ feeFlat: 0, feePercent: 150 }, 50_000)).toBe(50_000);
  });
});
