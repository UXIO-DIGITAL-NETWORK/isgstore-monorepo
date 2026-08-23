import { describe, it, expect } from "vitest";
import { simulateChannel } from "../lib/channelSimulation";

describe("simulateChannel", () => {
  it("computes fee, gateway cut, tax and profit for the QRIS example", () => {
    // User's reference: pay 60.000 via QRIS (0,7% channel fee, 0,7% gateway),
    // PPN 11% on the channel fee (420).
    const sim = simulateChannel(
      { fee_flat: 0, fee_percent: 0.7, gateway_fee_flat: 0, gateway_fee_percent: 0.7 },
      60000,
      11,
    );

    expect(sim.fee).toBe(420); // 0,7% of 60.000
    expect(sim.gatewayFee).toBe(423); // 0,7% of gross 60.420 → 422,94 → 423
    expect(sim.tax).toBe(46); // 11% of 420 → 46,2 → 46
    expect(sim.profit).toBe(420 - 423 - 46); // -49
  });

  it("taxes nothing for a flat channel with no percent fee", () => {
    const sim = simulateChannel(
      { fee_flat: 0, fee_percent: 0, gateway_fee_flat: 1900, gateway_fee_percent: 0 },
      60000,
      11,
    );

    expect(sim.fee).toBe(0);
    expect(sim.tax).toBe(0);
    expect(sim.gatewayFee).toBe(1900);
    expect(sim.profit).toBe(-1900); // fee − gatewayFee − tax
  });

  it("applies a flat channel fee plus percent on the nominal", () => {
    const sim = simulateChannel(
      { fee_flat: 1000, fee_percent: 1, gateway_fee_flat: 500, gateway_fee_percent: 0 },
      100000,
      11,
    );

    expect(sim.fee).toBe(2000); // 1000 + 1% of 100.000
    expect(sim.tax).toBe(220); // 11% of 2000
    expect(sim.gatewayFee).toBe(500);
    expect(sim.profit).toBe(2000 - 500 - 220); // 1280
  });

  it("clamps non-finite / negative inputs to 0 instead of producing NaN", () => {
    const sim = simulateChannel(
      { fee_flat: 0, fee_percent: 0.7, gateway_fee_flat: 0, gateway_fee_percent: 0.7 },
      Number.NaN,
      -5,
    );

    expect(sim.fee).toBe(0);
    expect(sim.gatewayFee).toBe(0);
    expect(sim.tax).toBe(0);
    expect(sim.profit).toBe(0);
  });
});
