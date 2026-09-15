import { describe, expect, it } from "vitest";

import { applyPoints, maxRedeemablePoints, orderTotalAfterDiscounts, pointsEarned, totalAfterPoints } from "./points";

describe("orderTotalAfterDiscounts", () => {
  it("takes the promo off before the points, and the fee on what is left", () => {
    // 100k − 10k promo = 90k; 20k of points → 70k; the 1k fee rides on that.
    expect(orderTotalAfterDiscounts(100000, 10000, 20000, 1000)).toBe(71000);
  });

  it("adds the fee to the undiscounted price when nothing is applied", () => {
    expect(orderTotalAfterDiscounts(100000, 0, 0, 1000)).toBe(101000);
  });

  it("owes nothing when the discounts cover the price", () => {
    // No payment left for a fee to sit on.
    expect(orderTotalAfterDiscounts(100000, 40000, 60000, 1000)).toBe(0);
  });

  it("never goes negative when a promo is worth more than the price", () => {
    expect(orderTotalAfterDiscounts(50000, 80000, 0, 0)).toBe(0);
  });
});

describe("maxRedeemablePoints", () => {
  it("is capped by the wallet of points", () => {
    expect(maxRedeemablePoints(12000, 2000, 1)).toBe(2000);
  });

  it("is capped by what the order is worth", () => {
    // Never overshoot into a credit note the storefront cannot honour.
    expect(maxRedeemablePoints(12000, 50000, 1)).toBe(12000);
  });

  it("rounds down when a point is worth more than a rupiah", () => {
    // 12000 / 500 = 24 exactly; 12100 / 500 must not become 25.
    expect(maxRedeemablePoints(12100, 999, 500)).toBe(24);
  });

  it("is zero for a free order or an empty balance", () => {
    expect(maxRedeemablePoints(0, 5000, 1)).toBe(0);
    expect(maxRedeemablePoints(12000, 0, 1)).toBe(0);
  });
});

describe("applyPoints", () => {
  it("discounts what the points are worth", () => {
    expect(applyPoints(12000, 5000, 1, 2000)).toEqual({ points: 2000, discount: 2000, coversEverything: false });
  });

  it("flags an order points cover entirely", () => {
    // The case with no gateway to call: nothing is owed.
    expect(applyPoints(12000, 20000, 1, 12000)).toEqual({
      points: 12000,
      discount: 12000,
      coversEverything: true,
    });
  });

  it("clamps a request larger than the balance", () => {
    expect(applyPoints(12000, 500, 1, 9999).points).toBe(500);
  });

  it("never returns negative points", () => {
    expect(applyPoints(12000, 5000, 1, -100).points).toBe(0);
  });
});

describe("totalAfterPoints", () => {
  it("charges the fee on the reduced price", () => {
    expect(totalAfterPoints(12000, 1000, 2000)).toBe(11000);
  });

  it("owes nothing at all when points cover the order", () => {
    // Including the admin fee — there is no payment to charge a fee on.
    expect(totalAfterPoints(12000, 1000, 12000)).toBe(0);
  });

  it("never goes negative when points overshoot", () => {
    expect(totalAfterPoints(12000, 1000, 20000)).toBe(0);
  });
});

describe("pointsEarned", () => {
  it("adds the flat bonus to the rounded-up percentage", () => {
    // 25.000 * 1% = 250, plus a flat 5.
    expect(pointsEarned(25000, 0, 1, 5)).toBe(255);
  });

  it("rounds the percentage up, never against the customer", () => {
    // 10.010 * 1% = 100,1.
    expect(pointsEarned(10010, 0, 1, 0)).toBe(101);
  });

  it("earns on the amount left after points are redeemed", () => {
    expect(pointsEarned(25000, 10000, 1, 0)).toBe(150);
  });

  it("earns nothing when points cover the whole order", () => {
    expect(pointsEarned(25000, 25000, 1, 5)).toBe(0);
  });

  it("still earns the flat bonus with no percentage configured", () => {
    expect(pointsEarned(25000, 0, 0, 10)).toBe(10);
  });

  it("earns nothing with no rule configured", () => {
    expect(pointsEarned(25000, 0, 0, 0)).toBe(0);
  });
});
