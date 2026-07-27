import { describe, it, expect } from "vitest";
import { subCategoriesService } from "../services/subCategories.service";
import { SUB_CATEGORIES } from "../data/sub-categories.data";
import { CATEGORIES } from "../data/categories.data";
import type { SubCategory } from "../types/subCategory.type";

/** Contract test — asserts the typed shape/params-mapping before any UI
 * consumes the service (system_architecture.md §4.11). Mirrors
 * categories.service.test.ts; §6 adds SubCategory as a feature-local entity. */
describe("subCategoriesService.list", () => {
  it("returns a PaginatedResponse<SubCategory> shape with no params", async () => {
    const result = await subCategoriesService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(SUB_CATEGORIES.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("caps returned rows to per_page", async () => {
    const result = await subCategoriesService.list({ per_page: 2 });
    expect(result.data.length).toBeLessThanOrEqual(2);
  });

  it("narrows by search across name/currency_name", async () => {
    const byName = await subCategoriesService.list({ search: "mobile legends" });
    expect(byName.data.length).toBeGreaterThan(0);
    for (const row of byName.data) expect(row.name.toLowerCase()).toContain("mobile legends");

    const byCurrency = await subCategoriesService.list({ search: "genesis" });
    expect(byCurrency.data.length).toBeGreaterThan(0);
    for (const row of byCurrency.data) expect(row.currency_name.toLowerCase()).toContain("genesis");
  });

  it("narrows by parent category_id exactly", async () => {
    const result = await subCategoriesService.list({ category_id: "cat-1" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.category_id).toBe("cat-1");
  });

  it("every fixture row points at a real parent Category", () => {
    const categoryIds = new Set(CATEGORIES.map((row) => row.id));
    for (const row of SUB_CATEGORIES) {
      expect(categoryIds.has(row.category_id)).toBe(true);
    }
  });

  it("includes both active and inactive rows in the fixtures", async () => {
    const result = await subCategoriesService.list({ per_page: 50 });
    expect(result.data.some((row) => row.status === "active")).toBe(true);
    expect(result.data.some((row) => row.status === "inactive")).toBe(true);
  });

  it("uses varied fixture content, never the shadcn demo dataset", async () => {
    const result = await subCategoriesService.list({ per_page: 50 });
    const banned = ["Cover Page", "Table of Contents", "Jamik Tashpulatov", "Eddie Lake"];
    for (const row of result.data) {
      for (const word of banned) expect(row.name).not.toContain(word);
    }
    expect(new Set(result.data.map((row) => row.name)).size).toBe(result.data.length);
  });
});

describe("subCategoriesService.getById", () => {
  it("resolves the typed sub category for a known id", async () => {
    await expect(subCategoriesService.getById(SUB_CATEGORIES[0].id)).resolves.toMatchObject({
      id: SUB_CATEGORIES[0].id,
    });
  });

  it("throws for an unknown id", async () => {
    await expect(subCategoriesService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("subCategoriesService mutations", () => {
  it("create adds a sub category and returns it with an id/timestamps", async () => {
    const input: Omit<SubCategory, "id" | "created_at" | "updated_at"> = {
      category_id: "cat-2",
      name: "Free Fire: Brazil",
      currency_name: "Diamonds",
      status: "active",
    };
    const created = await subCategoriesService.create(input);

    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();
    expect(created.updated_at).toBeTruthy();
    await expect(subCategoriesService.getById(created.id)).resolves.toMatchObject({ name: "Free Fire: Brazil" });
  });

  it("update patches a known sub category", async () => {
    const created = await subCategoriesService.create({
      category_id: "cat-3",
      name: "Genshin Impact: Europe",
      currency_name: "Genesis Crystals",
      status: "active",
    });
    const updated = await subCategoriesService.update(created.id, { status: "inactive" });

    expect(updated.status).toBe("inactive");
    expect(updated.name).toBe("Genshin Impact: Europe");
    await expect(subCategoriesService.update("does-not-exist", { status: "active" })).rejects.toThrow();
  });

  it("remove deletes a known sub category and throws for an unknown id", async () => {
    const created = await subCategoriesService.create({
      category_id: "cat-5",
      name: "Valorant: Removable",
      currency_name: "Valorant Points",
      status: "active",
    });
    await expect(subCategoriesService.remove(created.id)).resolves.toBeUndefined();
    await expect(subCategoriesService.getById(created.id)).rejects.toThrow();
    await expect(subCategoriesService.remove("does-not-exist")).rejects.toThrow();
  });
});
