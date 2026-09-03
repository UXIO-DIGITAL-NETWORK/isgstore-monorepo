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

/**
 * The list mapper is what the Set Profit Margin page reads. It had no coverage
 * at all, which is how a renamed API field (`preview_prices` →
 * `preview_plan_prices`) reached production as "every price shows Rp 0".
 */
describe("providerService.list — pooled row prices", () => {
  const pooledRow = (over: Record<string, unknown> = {}) => ({
    id: 4,
    product_id: null,
    buyer_sku_code: "VAL420",
    provider_name: "Valorant 420 Points",
    price: 50000,
    is_active: false,
    is_price_locked: false,
    is_system: false,
    buyer_product_status: true,
    pool_state: "ready",
    can_promote: true,
    promote_blocked_reason: null,
    price_min: null,
    price_max: null,
    pool_category: { id: 3, name: "Valorant" },
    preview_plan_prices: [
      { membership_plan_id: 1, plan_code: "free", plan_name: "Basic", is_default: true, price: 60000 },
      { membership_plan_id: 3, plan_code: "gold", plan_name: "Gold", is_default: false, price: 52500 },
    ],
    plan_margins: [{ membership_plan_id: 1, margin_percent: 20 }],
    point_percent: 2.5,
    point_flat: 50,
    margins: { member: 20, vip: null, reseller: null, agent: null },
    product: null,
    supplier: { id: 1, name: "Uxiotopup", is_system: false },
    created_at: "2026-08-24T10:05:00.000000Z",
    ...over,
  });

  it("carries the plan-keyed preview, margins and points through", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([pooledRow()]));

    const row = (await providerService.list()).data[0];

    expect(row.preview_plan_prices).toHaveLength(2);
    expect(row.preview_plan_prices[0]).toMatchObject({ plan_name: "Basic", is_default: true, price: 60000 });
    expect(row.plan_margins).toEqual([{ membership_plan_id: 1, margin_percent: 20 }]);
    expect(row.point_percent).toBe(2.5);
    expect(row.point_flat).toBe(50);
  });

  it("falls back to the plan order for the legacy four-tier price cell", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([pooledRow()]));

    const row = (await providerService.list()).data[0];

    // The provider table still renders four fixed tiers; the default plan is
    // first in the admin's own sort order, so it drives the retail row.
    expect(row.variant.prices.public).toBe(60000);
    expect(row.variant.prices.vip).toBe(52500);
    expect(row.variant.cost_price).toBe(50000);
  });

  it("reports a plan whose price the API omitted as null, not as a margin", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([pooledRow({ preview_plan_prices: null, plan_margins: null })]));

    const row = (await providerService.list()).data[0];

    expect(row.preview_plan_prices).toEqual([]);
    expect(row.plan_margins).toEqual([]);
  });
});
