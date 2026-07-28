import { describe, it, expect } from "vitest";
import { categoryProvidersService } from "../services/categoryProviders.service";
import { CATEGORY_PROVIDERS } from "../data/category-providers.data";
import { CATEGORIES } from "../data/categories.data";
import type { CategoryProvider } from "../types/categoryProvider.type";

/** Contract test — asserts the typed shape/params-mapping before any UI
 * consumes the service (system_architecture.md §4.11). Mirrors
 * categoryServers.service.test.ts; §6 line 286 adds CategoryProvider as a
 * feature-local entity with no `status` field, and with `category_id`
 * pointing at this same feature's own Category records. */
describe("categoryProvidersService.list", () => {
  it("returns a PaginatedResponse<CategoryProvider> shape with no params", async () => {
    const result = await categoryProvidersService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(CATEGORY_PROVIDERS.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("caps returned rows to per_page", async () => {
    const result = await categoryProvidersService.list({ per_page: 1 });
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it("narrows by search over the provider name", async () => {
    const result = await categoryProvidersService.list({ search: "digiflazz" });

    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      expect(`${row.provider_name} ${row.provider_template}`.toLowerCase()).toContain("digiflazz");
    }
  });

  it("narrows by the provider_name filter behind the toolbar's provider select", async () => {
    const result = await categoryProvidersService.list({ provider_name: "UxioTopup", per_page: 50 });

    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.provider_name).toBe("UxioTopup");
  });

  it("has no status field — this entity has no active/inactive concept", async () => {
    const result = await categoryProvidersService.list({ per_page: 50 });
    for (const row of result.data) expect(row).not.toHaveProperty("status");
  });

  it("uses the supplier names already fixtured in financial/integration, not invented ones", async () => {
    const result = await categoryProvidersService.list({ per_page: 50 });
    // §4.5 line 239: the Provider column's values are the same supplier names
    // used in §4.2 / §4.4. Feature isolation forbids importing those fixtures,
    // so the names are mirrored — this pins them so a typo can't drift.
    const suppliers = ["Digiflazz Buyer", "Digiflazz Seller", "UxioTopup", "Zelpoint", "Topupkuy"];

    expect(result.data.some((row) => row.provider_name === "Digiflazz Buyer")).toBe(true);
    expect(result.data.some((row) => row.provider_name === "UxioTopup")).toBe(true);
    for (const row of result.data) expect(suppliers).toContain(row.provider_name);
  });

  it("every category_id resolves against a real Category record", async () => {
    const result = await categoryProvidersService.list({ per_page: 50 });
    const categoryIds = CATEGORIES.map((category) => category.id);

    for (const row of result.data) {
      expect(row.provider_template.trim()).not.toBe("");
      expect(categoryIds).toContain(row.category_id);
    }
  });
});

describe("categoryProvidersService.getById", () => {
  it("resolves the typed category provider for a known id", async () => {
    await expect(categoryProvidersService.getById(CATEGORY_PROVIDERS[0].id)).resolves.toMatchObject({
      id: CATEGORY_PROVIDERS[0].id,
    });
  });

  it("throws for an unknown id", async () => {
    await expect(categoryProvidersService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("categoryProvidersService mutations", () => {
  it("create adds a category provider", async () => {
    const input: Omit<CategoryProvider, "id" | "created_at" | "updated_at"> = {
      provider_name: "Zelpoint",
      category_id: "cat-3",
      provider_template: "Games-Genshin Impact",
    };
    const created = await categoryProvidersService.create(input);

    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();
    await expect(categoryProvidersService.getById(created.id)).resolves.toMatchObject(input);
  });

  it("update patches a known category provider", async () => {
    const created = await categoryProvidersService.create({
      provider_name: "Topupkuy",
      category_id: "cat-5",
      provider_template: "Games-Valorant",
    });
    const updated = await categoryProvidersService.update(created.id, { provider_template: "Patched Template" });

    expect(updated.provider_template).toBe("Patched Template");
    expect(updated.provider_name).toBe("Topupkuy");
    await expect(categoryProvidersService.update("does-not-exist", { provider_name: "x" })).rejects.toThrow();
  });

  it("remove deletes a known category provider and throws for an unknown id", async () => {
    const created = await categoryProvidersService.create({
      provider_name: "Zelpoint",
      category_id: "cat-6",
      provider_template: "Voucher-Steam Wallet",
    });

    await expect(categoryProvidersService.remove(created.id)).resolves.toBeUndefined();
    await expect(categoryProvidersService.getById(created.id)).rejects.toThrow();
    await expect(categoryProvidersService.remove("does-not-exist")).rejects.toThrow();
  });
});
