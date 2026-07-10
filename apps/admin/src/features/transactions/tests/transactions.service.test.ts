import { describe, it, expect } from "vitest";
import { transactionsService } from "../services/transactions.service";
import { TRANSACTIONS } from "../data/transactions.data";

describe("transactionsService.list", () => {
  it("returns a PaginatedResponse<Transaction> shape with no params", async () => {
    const result = await transactionsService.list({});

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({
      current_page: 1,
      per_page: 10,
    });
    expect(typeof result.meta.from).toBe("number");
    expect(typeof result.meta.to).toBe("number");
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
    expect(result.links).toHaveProperty("prev");
    expect(result.links).toHaveProperty("next");
  });

  it("uses the literal placeholder total 9999999, not fixtures.length", async () => {
    const result = await transactionsService.list({});
    expect(result.meta.total).toBe(9999999);
  });

  it("caps returned rows to per_page", async () => {
    const result = await transactionsService.list({ per_page: 5 });
    expect(result.data.length).toBeLessThanOrEqual(5);
  });

  it("narrows by search across invoice_no/customer name", async () => {
    const result = await transactionsService.list({ search: "Randy" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      expect(row.customer.name.toLowerCase().includes("randy") || row.invoice_no.toLowerCase().includes("randy")).toBe(
        true,
      );
    }
  });

  it("narrows by invoiceStatus exactly", async () => {
    const result = await transactionsService.list({ invoiceStatus: "failed" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      expect(row.invoice_status).toBe("failed");
    }
  });

  it("sorts by cost ascending/descending when sortBy/sortDir are given", async () => {
    const asc = await transactionsService.list({ per_page: 50, sortBy: "cost", sortDir: "asc" });
    const costs = asc.data.map((row) => row.cost);
    expect(costs).toEqual([...costs].sort((a, b) => a - b));

    const desc = await transactionsService.list({ per_page: 50, sortBy: "cost", sortDir: "desc" });
    const descCosts = desc.data.map((row) => row.cost);
    expect(descCosts).toEqual([...descCosts].sort((a, b) => b - a));
  });

  it("leaves row order unchanged when sortBy is omitted", async () => {
    const result = await transactionsService.list({ per_page: 50 });
    expect(result.data.map((row) => row.id)).toEqual(TRANSACTIONS.slice(0, 50).map((row) => row.id));
  });
});

describe("transactionsService.getById", () => {
  it("resolves the typed transaction for a known id", async () => {
    const known = TRANSACTIONS[0];
    await expect(transactionsService.getById(known.id)).resolves.toEqual(known);
  });

  it("throws for an unknown id", async () => {
    await expect(transactionsService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("transactionsService.getStatusCounts", () => {
  it("resolves the exact reference pill counts", async () => {
    await expect(transactionsService.getStatusCounts()).resolves.toEqual({
      pending: 12,
      partial_refund: 32,
      partial_success: 8,
    });
  });
});

describe("transactionsService mutations", () => {
  it("remove resolves without throwing", async () => {
    await expect(transactionsService.remove(TRANSACTIONS[0].id)).resolves.toBeUndefined();
  });
});
