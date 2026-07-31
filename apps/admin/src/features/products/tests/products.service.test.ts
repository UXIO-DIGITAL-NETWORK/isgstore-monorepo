import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { productsService } from "../services/products.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 21,
  category_id: 1,
  sub_category_id: 3,
  name: "MOBILELEGEND - 100 Diamond",
  sub_name: "Bonus",
  code: "ML100",
  logo_url: null,
  description: "desc",
  validasi_nickname: "mlbb",
  access: "public",
  tag: "HOT",
  price_modal: 20000,
  price_member: 24000,
  price_vip: 23000,
  price_reseller: 22000,
  price_agent: 21000,
  status: true,
  is_available: true,
  category: { id: 1, name: "Mobile Legends" },
  sub_category: { id: 3, name: "Diamond" },
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("productsService.list", () => {
  /**
   * The API is flat — one row per denomination — while this feature models a
   * product as a container of variants. Each row becomes a single-variant
   * product so the price cell renders unchanged.
   */
  it("maps a flat API row into a single-variant product", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await productsService.list();

    expect(result.data[0]).toMatchObject({
      id: "21",
      name: "MOBILELEGEND - 100 Diamond",
      game_name: "Mobile Legends",
      category_name: "Diamond",
      status: "active",
      is_available: true,
    });
    expect(result.data[0].variants).toHaveLength(1);
    expect(result.data[0].variants[0]).toMatchObject({
      cost_price: 20000,
      prices: { public: 24000, vip: 23000, reseller: 22000, agent: 21000 },
    });
  });

  it("keeps status and is_available independent — they are different axes", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ status: true, is_available: false })]));

    const result = await productsService.list();

    expect(result.data[0]).toMatchObject({ status: "active", is_available: false });
  });

  it("translates a named price bucket into the API's min/max params", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await productsService.list({ search: "diamond", per_page: 20, price: "under-50k" });

    const [, config] = vi.mocked(api.get).mock.calls[0];
    expect(config?.params).toMatchObject({ search: "diamond", per_page: 20 });
    expect(config?.params).toHaveProperty("min_price");
  });

  // A bucket the options list does not know must narrow to nothing, never
  // silently widen back to every product.
  it("narrows to nothing for an unknown price bucket", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await productsService.list({ price: "not-a-bucket" });

    expect(vi.mocked(api.get).mock.calls[0][1]?.params).toMatchObject({ min_price: Number.MAX_SAFE_INTEGER });
  });
});

describe("productsService.update", () => {
  // The API marks category_id, name, code and all five prices required, so a
  // partial patch would 422 — the service merges onto the current row first.
  it("merges onto the fetched row so a partial edit still satisfies the API", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ tag: "NEW" })));

    await productsService.update("21", { tag: "NEW" });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    const form = body as FormData;
    expect(url).toBe("/v1/products/21");
    expect(form.get("_method")).toBe("PUT");
    expect(form.get("tag")).toBe("NEW");
    // Carried across from the fetched row rather than dropped.
    expect(form.get("name")).toBe("MOBILELEGEND - 100 Diamond");
    expect(form.get("price_member")).toBe("24000");
  });
});

describe("productsService.deactivate", () => {
  it("changes lifecycle status only, leaving storefront visibility alone", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow({ is_available: true })));
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ status: false, is_available: true })));

    await productsService.deactivate("21");

    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get("status")).toBe("0");
    expect(form.get("is_available")).toBe("1");
  });
});

describe("productsService.remove", () => {
  it("deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(productsService.remove("21")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/products/21");
  });
});
