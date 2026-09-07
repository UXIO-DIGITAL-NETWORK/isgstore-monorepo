import { describe, expect, it } from "vitest";

import type { InvoiceModel } from "@/types/models/transaction.model";
import { toOrder } from "./toOrder";

const invoice = (overrides: Partial<InvoiceModel> = {}): InvoiceModel =>
  ({
    invoice_number: "INV-20260731-ABC123",
    status: "PENDING",
    is_terminal: false,
    game: null,
    product: { name: "50 Diamond" },
    target: { uid: "63193868", server: "2027", nickname: null },
    amount: { base: 32430, fee: 227, admin_fee: 227, total: 32657 },
    payment: {
      channel: "QRIS",
      channel_code: "qris",
      type: null,
      reference_id: null,
      status: null,
      paid_at: null,
      instructions: null,
    },
    expires_at: null,
    sn: null,
    created_at: "2026-09-03T00:00:00.000Z",
    ...overrides,
  }) as InvoiceModel;

describe("toOrder", () => {
  it("carries the points block through", () => {
    const order = toOrder(invoice({ points: { earned: 324, is_estimate: true, eligible: true } }));

    expect(order.pointsEarned).toBe(324);
    expect(order.pointsAreEstimate).toBe(true);
    expect(order.pointsEligible).toBe(true);
  });

  it("leaves the points fields undefined when the API omits the block", () => {
    // An API deployed before this field exists must not make the page render a
    // zero as though it were a fact.
    const order = toOrder(invoice());

    expect(order.pointsEarned).toBeUndefined();
    expect(order.pointsEligible).toBeUndefined();
  });

  it("still maps the money rows the card already showed", () => {
    const order = toOrder(invoice());

    expect(order.price).toBe(32430);
    expect(order.adminFee).toBe(227);
    expect(order.total).toBe(32657);
  });
});
