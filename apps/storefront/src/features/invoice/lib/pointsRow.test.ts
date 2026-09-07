import { describe, expect, it } from "vitest";

import { pointsRowState } from "./pointsRow";

describe("pointsRowState", () => {
  it("calls an open order's figure an estimate", () => {
    expect(pointsRowState({ earned: 500, isEstimate: true, eligible: true })).toEqual({
      kind: "estimate",
      points: 500,
    });
  });

  it("calls a completed order's figure earned", () => {
    expect(pointsRowState({ earned: 500, isEstimate: false, eligible: true })).toEqual({
      kind: "earned",
      points: 500,
    });
  });

  it("shows a guest an invitation and never a number", () => {
    // The order is already placed; no account can be attached to it after the
    // fact, so a figure here would be a promise nothing will keep.
    expect(pointsRowState({ earned: 0, isEstimate: true, eligible: false })).toEqual({
      kind: "guest",
      points: 0,
    });
  });

  it("stays silent when the order earns nothing", () => {
    // A failed order, or an order settled entirely in points.
    expect(pointsRowState({ earned: 0, isEstimate: false, eligible: true })).toEqual({
      kind: "none",
      points: 0,
    });
  });

  it("stays silent when the API sent no points block at all", () => {
    // The three repos deploy independently; an older API must not make the page
    // invent a figure.
    expect(pointsRowState({})).toEqual({ kind: "none", points: 0 });
  });

  it("never reports a negative figure", () => {
    expect(pointsRowState({ earned: -5, isEstimate: true, eligible: true }).points).toBe(0);
  });
});
