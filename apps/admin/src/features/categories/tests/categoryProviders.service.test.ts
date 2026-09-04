import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { categoryProvidersService } from "../services/categoryProviders.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 9,
  category_id: 1,
  supplier_id: 4,
  provider_category: "mlbb",
  supplier: { id: 4, name: "Uxiolabs" },
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

/**
 * "Category Provider" is this feature's name for the API's **supplier
 * category**. The translation lives entirely in the service, so these tests
 * are what pin the two vocabularies together.
 */
describe("categoryProvidersService.list", () => {
  it("calls the supplier-categories endpoint and maps the supplier name across", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await categoryProvidersService.list();

    expect(api.get).toHaveBeenCalledWith("/v1/supplier-categories", { params: {} });
    expect(result.data[0]).toMatchObject({
      id: "9",
      category_id: "1",
      provider_name: "Uxiolabs",
      provider_category: "mlbb",
    });
  });

  // Superseded: the filter used to fold the provider's *name* into `search`,
  // which also matched provider_category and the category name and so widened
  // the results. The API filters on `supplier_id` exactly, so it now goes
  // through untouched.
  it("passes the supplier id straight through as an exact filter", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    await categoryProvidersService.list({ supplier_id: "2", page: 2 });

    expect(api.get).toHaveBeenCalledWith("/v1/supplier-categories", {
      params: { supplier_id: "2", page: 2 },
    });
  });

  it("falls back to the supplier id when the relation was not eager-loaded", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ supplier: null })]));

    const result = await categoryProvidersService.list();

    expect(result.data[0].provider_name).toBe("4");
  });
});

describe("categoryProvidersService mutations", () => {
  it("create maps provider_category onto provider_category and sends numeric FKs", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await categoryProvidersService.create({
      category_id: "1",
      supplier_id: "4",
      provider_name: "Uxiolabs",
      provider_category: "mlbb",
    });

    expect(api.post).toHaveBeenCalledWith("/v1/supplier-categories", {
      category_id: 1,
      supplier_id: 4,
      provider_category: "mlbb",
    });
  });

  it("update sends only the mapped fields it was given", async () => {
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow({ provider_category: "ff" })));

    await categoryProvidersService.update("9", { provider_category: "ff" });

    expect(api.put).toHaveBeenCalledWith("/v1/supplier-categories/9", { provider_category: "ff" });
  });

  it("remove deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(categoryProvidersService.remove("9")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/supplier-categories/9");
  });
});
