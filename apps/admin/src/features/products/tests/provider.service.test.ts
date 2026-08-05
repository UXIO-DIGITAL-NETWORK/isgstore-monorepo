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
  brand: "XL",
  category: "Pulsa",
  seller_name: "PT. ABC",
  desc: "Pulsa Xl Rp 100.000",
  type: "prepaid",
  cost: 98000,
  available: true,
  already_mapped: false,
  buyer_product_status: true,
  seller_product_status: true,
  product_type: "Umum",
  price: 98000,
  unlimited_stock: true,
  stock: 0,
  multi: true,
  start_cut_off: "23:45",
  end_cut_off: "00:15",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("providerService.priceList", () => {
  it("unwraps the paginator and keys each row by its buyer_sku_code", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([priceRow()]));

    const result = await providerService.priceList({ type: "prepaid" });

    expect(api.get).toHaveBeenCalledWith("/v1/digiflazz/price-list", { params: { type: "prepaid" } });
    expect(result.data[0].id).toBe("X100");
    expect(result.data[0]).toMatchObject({ name: "Xl 100.000", cost: 98000, already_mapped: false });
  });

  it("forwards search and only_unmapped params", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await providerService.priceList({ type: "pasca", search: "pln", only_unmapped: true, page: 2, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith("/v1/digiflazz/price-list", {
      params: { type: "pasca", search: "pln", only_unmapped: true, page: 2, per_page: 20 },
    });
  });
});

describe("providerService.skuPreview", () => {
  it("passes a numeric category_id when provided", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ buyer_sku_code: "X100", suggested_prices: {} }));

    await providerService.skuPreview("X100", "prepaid", "7");

    expect(api.get).toHaveBeenCalledWith("/v1/digiflazz/sku-preview", {
      params: { buyer_sku_code: "X100", type: "prepaid", category_id: 7 },
    });
  });

  it("omits category_id when not chosen yet", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ buyer_sku_code: "X100", suggested_prices: {} }));

    await providerService.skuPreview("X100", "prepaid");

    expect(api.get).toHaveBeenCalledWith("/v1/digiflazz/sku-preview", {
      params: { buyer_sku_code: "X100", type: "prepaid" },
    });
  });
});

describe("providerService.add", () => {
  it("sends a numeric category_id, explicit prices, and omits an empty name", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(null));

    await providerService.add({
      buyer_sku_code: "X100",
      type: "prepaid",
      category_id: "7",
      price_member: 100000,
      price_vip: 99500,
      price_reseller: 99000,
      price_agent: 98500,
      status: true,
    });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/digiflazz/products");
    expect(body).toMatchObject({
      buyer_sku_code: "X100",
      type: "prepaid",
      category_id: 7,
      sub_category_id: null,
      price_member: 100000,
      status: true,
    });
    expect(body).not.toHaveProperty("name");
  });
});

describe("providerService.bulkAdd", () => {
  it("sends the shared category and the SKU list, no prices", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope({ created: 2, skipped: [] }));

    const result = await providerService.bulkAdd({
      type: "prepaid",
      category_id: "7",
      status: true,
      buyer_sku_codes: ["X100", "S5"],
    });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/digiflazz/products/bulk");
    expect(body).toMatchObject({ category_id: 7, buyer_sku_codes: ["X100", "S5"], status: true });
    expect(body).not.toHaveProperty("price_member");
    expect(result).toEqual({ created: 2, skipped: [] });
  });
});
