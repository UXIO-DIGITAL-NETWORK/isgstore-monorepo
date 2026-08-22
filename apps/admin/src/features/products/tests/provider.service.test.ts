import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { providerService } from "../services/provider.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const priceRow = (over: Record<string, unknown> = {}) => ({
  buyer_sku_code: "X100",
  name: "Xl 100.000",
  category: "Pulsa",
  cost: 98000,
  harga: 98000,
  harga_gold: 97800,
  harga_silver: 97900,
  harga_pro: 97700,
  available: true,
  already_mapped: false,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("providerService.priceList", () => {
  it("unwraps the paginator and keys each row by its buyer_sku_code", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([priceRow()]));

    const result = await providerService.priceList({});

    expect(api.get).toHaveBeenCalledWith("/v1/uxiotopup/price-list", { params: {} });
    expect(result.data[0].id).toBe("X100");
    expect(result.data[0]).toMatchObject({ name: "Xl 100.000", cost: 98000, already_mapped: false });
  });

  it("sends only_unmapped as 1 so the API's boolean rule accepts it", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await providerService.priceList({ search: "pln", only_unmapped: true, page: 2, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith("/v1/uxiotopup/price-list", {
      params: { search: "pln", only_unmapped: 1, page: 2, per_page: 20 },
    });
  });

  it("omits only_unmapped entirely when false", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await providerService.priceList({ only_unmapped: false });

    expect(api.get).toHaveBeenLastCalledWith("/v1/uxiotopup/price-list", { params: {} });
  });
});

describe("providerService.skuPreview", () => {
  it("passes a numeric category_id when provided", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ buyer_sku_code: "X100", suggested_prices: {} }));

    await providerService.skuPreview("X100", "7");

    expect(api.get).toHaveBeenCalledWith("/v1/uxiotopup/sku-preview", {
      params: { buyer_sku_code: "X100", category_id: 7 },
    });
  });

  it("omits category_id when not chosen yet", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ buyer_sku_code: "X100", suggested_prices: {} }));

    await providerService.skuPreview("X100");

    expect(api.get).toHaveBeenCalledWith("/v1/uxiotopup/sku-preview", {
      params: { buyer_sku_code: "X100" },
    });
  });
});

describe("providerService.add", () => {
  it("sends a numeric category_id, explicit prices, and omits an empty name", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(null));

    await providerService.add({
      buyer_sku_code: "X100",
      category_id: "7",
      price_member: 100000,
      price_vip: 99500,
      price_reseller: 99000,
      price_agent: 98500,
      status: true,
    });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/uxiotopup/products");
    expect(body).toMatchObject({
      buyer_sku_code: "X100",
      category_id: 7,
      sub_category_id: null,
      price_member: 100000,
      status: true,
    });
    expect(body).not.toHaveProperty("name");
    expect(body).not.toHaveProperty("type");
  });
});

describe("providerService.bulkAdd", () => {
  it("sends the shared category and the SKU list, no prices", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope({ created: 2, skipped: [] }));

    const result = await providerService.bulkAdd({
      category_id: "7",
      status: true,
      buyer_sku_codes: ["X100", "S5"],
    });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/uxiotopup/products/bulk");
    expect(body).toMatchObject({ category_id: 7, buyer_sku_codes: ["X100", "S5"], status: true });
    expect(body).not.toHaveProperty("price_member");
    expect(body).not.toHaveProperty("type");
    expect(result).toEqual({ created: 2, skipped: [] });
  });
});
