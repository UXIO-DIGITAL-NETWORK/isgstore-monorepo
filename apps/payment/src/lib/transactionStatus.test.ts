import { describe, expect, it } from "vitest";

import {
  paymentLabel,
  providerLabel,
  resolvePaymentStatus,
  resolveProviderStatus,
} from "./transactionStatus";

/**
 * The merchant-facing vocabulary for the two lifecycles.
 *
 * Until now the Transaksi table printed the raw enum string, so a merchant read
 * "FAILED_PROVIDER" and "PROCESSING" verbatim. These are the labels that replace
 * that, plus the fallbacks that keep the page correct against an API that has
 * not shipped the split yet.
 */
describe("paymentLabel", () => {
  it.each([
    ["PENDING", "Menunggu Bayar"],
    ["SUCCESS", "Lunas"],
    ["EXPIRED", "Kedaluwarsa"],
    ["REFUNDED", "Dikembalikan"],
    ["CANCELLED", "Dibatalkan"],
  ] as const)("labels %s", (status, label) => {
    expect(paymentLabel(status)).toBe(label);
  });

  it("renders a dash when there is nothing to say", () => {
    expect(paymentLabel(null)).toBe("—");
  });
});

describe("providerLabel", () => {
  /**
   * A merchant does not need our internal fulfilment mechanics — "Belum
   * Terkonfirmasi" would only produce a support ticket. Kita does need them.
   */
  it("folds the eight states into four for a merchant", () => {
    expect(providerLabel("QUEUED", "merchant")).toBe("Diproses");
    expect(providerLabel("SENDING", "merchant")).toBe("Diproses");
    expect(providerLabel("ORDERED", "merchant")).toBe("Diproses");
    expect(providerLabel("UNCONFIRMED", "merchant")).toBe("Diproses");
    expect(providerLabel("DELIVERED", "merchant")).toBe("Berhasil");
    expect(providerLabel("REJECTED", "merchant")).toBe("Gagal");
    expect(providerLabel("UNDELIVERED", "merchant")).toBe("Gagal");
    expect(providerLabel("NOT_ORDERED", "merchant")).toBe("Belum Diproses");
  });

  it("keeps every state distinct for the internal view", () => {
    const labels = (
      [
        "NOT_ORDERED",
        "QUEUED",
        "SENDING",
        "ORDERED",
        "UNCONFIRMED",
        "DELIVERED",
        "REJECTED",
        "UNDELIVERED",
      ] as const
    ).map((s) => providerLabel(s, "internal"));

    expect(new Set(labels).size).toBe(labels.length);
    expect(providerLabel("UNCONFIRMED", "internal")).toBe("Belum Terkonfirmasi");
    expect(providerLabel("UNDELIVERED", "internal")).toBe("Tidak Terkirim");
  });

  it("renders a dash for a row with no provider at all", () => {
    // A service bill is not a top-up; it has no supplier behind it.
    expect(providerLabel(null, "merchant")).toBe("—");
    expect(providerLabel(null, "internal")).toBe("—");
  });

  it("never leaks a raw enum string", () => {
    for (const audience of ["merchant", "internal"] as const) {
      expect(providerLabel("FAILED_PROVIDER" as never, audience)).toBe("—");
    }
  });
});

describe("fallbacks for an API that predates the split", () => {
  it("derives a payment status from the row's own status", () => {
    expect(resolvePaymentStatus({ status: "COMPLETED" })).toBe("SUCCESS");
    expect(resolvePaymentStatus({ status: "PENDING" })).toBe("PENDING");
    expect(resolvePaymentStatus({ status: "EXPIRED" })).toBe("EXPIRED");
    expect(resolvePaymentStatus({ status: "REFUNDED" })).toBe("REFUNDED");
    expect(resolvePaymentStatus({ status: "CANCELLED" })).toBe("CANCELLED");
    // The money WAS taken — the supplier is the half that failed.
    expect(resolvePaymentStatus({ status: "FAILED_PROVIDER" })).toBe("SUCCESS");
  });

  it("prefers the field the API sends over the fallback", () => {
    expect(resolvePaymentStatus({ status: "COMPLETED", payment_status: "REFUNDED" })).toBe("REFUNDED");
    expect(resolveProviderStatus({ status: "PROCESSING", provider_status: "UNCONFIRMED" })).toBe("UNCONFIRMED");
  });

  it("derives a provider status from the row's own status", () => {
    expect(resolveProviderStatus({ status: "COMPLETED" })).toBe("DELIVERED");
    expect(resolveProviderStatus({ status: "FAILED_PROVIDER" })).toBe("REJECTED");
    expect(resolveProviderStatus({ status: "PROCESSING" })).toBe("ORDERED");
  });

  it("has no provider for a service-invoice row", () => {
    // Service-invoice statuses have no supplier meaning at all, so they must
    // resolve to nothing rather than being forced into a top-up vocabulary.
    // "PAID" is ambiguous on its own — a settled bill here, an awaiting-fulfilment
    // top-up there — so the row's `type` is what decides.
    expect(resolveProviderStatus({ type: "service", status: "UNPAID" })).toBeNull();
    expect(resolveProviderStatus({ type: "service", status: "PAID" })).toBeNull();
    expect(resolveProviderStatus({ type: "service", status: "CANCELLED" })).toBeNull();
    expect(resolveProviderStatus({ type: "sale", status: "PAID" })).toBe("QUEUED");
  });
});
