import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope } from "@/test/apiEnvelope";
import { financialService } from "../services/financial.service";

vi.mock("@/lib/axios", () => ({ api: { get: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe("financialService.getSummaryCards", () => {
  it("turns the API's stable card keys into the labels the cards render", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([
        { key: "credit", value: 15231.89, delta_pct: 12.5, direction: "up", caption: "Since last month" },
        { key: "debit", value: 1200, delta_pct: 20, direction: "down", caption: "Since last month" },
        { key: "profit", value: 800, delta_pct: 5, direction: "up", caption: "Since last month" },
      ]),
    );

    const result = await financialService.getSummaryCards();

    expect(api.get).toHaveBeenCalledWith("/v1/financial/summary");
    expect(result[0]).toMatchObject({ id: "credit", label: "Total Credit", value: 15231.89, deltaPct: 12.5 });
    expect(result[1].label).toBe("Total Debit");
    expect(result[2].label).toBe("Profit");
  });

  // StatCard only renders its trend pill when both are present, and the API
  // sends nulls when there is no prior month to compare against.
  it("omits the trend pair entirely when the API has no comparison", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([{ key: "credit", value: 100, delta_pct: null, direction: null, caption: "Since last month" }]),
    );

    const result = await financialService.getSummaryCards();

    expect(result[0]).not.toHaveProperty("deltaPct");
    expect(result[0]).not.toHaveProperty("direction");
  });
});

describe("financialService.getPaymentGateways", () => {
  it("maps the snake_case balances onto the camelCase view type", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([{ id: "monetapay", name: "Monetapay", active_balance: 500, held_balance: 100 }]),
    );

    const result = await financialService.getPaymentGateways();

    expect(api.get).toHaveBeenCalledWith("/v1/financial/payment-gateways");
    expect(result[0]).toEqual({
      id: "monetapay",
      name: "Monetapay",
      logoUrl: "",
      activeBalance: 500,
      heldBalance: 100,
    });
  });
});

describe("financialService.getSuppliers", () => {
  /**
   * Only providers with a live balance integration report a figure. Null has
   * to survive the mapper: coercing it to 0 would show an unreachable
   * supplier as having an empty wallet.
   */
  it("preserves a null balance rather than coercing it to zero", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([
        { id: 1, name: "Digiflazz", balance: 15231.89 },
        { id: 2, name: "Zelpoint", balance: null },
      ]),
    );

    const result = await financialService.getSuppliers();

    expect(api.get).toHaveBeenCalledWith("/v1/financial/suppliers");
    expect(result[0]).toEqual({ id: "1", name: "Digiflazz", logoUrl: "", balance: 15231.89 });
    expect(result[1].balance).toBeNull();
  });
});
