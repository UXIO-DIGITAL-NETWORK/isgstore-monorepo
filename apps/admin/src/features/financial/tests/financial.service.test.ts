import { describe, it, expect } from "vitest";
import { financialService } from "../services/financial.service";
import { SUMMARY_CARDS } from "../data/summary-cards.data";
import { PAYMENT_GATEWAYS } from "../data/payment-gateways.data";
import { SUPPLIERS } from "../data/suppliers.data";

describe("financialService", () => {
  it("getSummaryCards resolves the summary-card fixtures", async () => {
    await expect(financialService.getSummaryCards()).resolves.toEqual(SUMMARY_CARDS);
  });

  it("getPaymentGateways resolves the payment-gateway fixtures", async () => {
    await expect(financialService.getPaymentGateways()).resolves.toEqual(PAYMENT_GATEWAYS);
  });

  it("getSuppliers resolves the supplier fixtures", async () => {
    await expect(financialService.getSuppliers()).resolves.toEqual(SUPPLIERS);
  });
});
