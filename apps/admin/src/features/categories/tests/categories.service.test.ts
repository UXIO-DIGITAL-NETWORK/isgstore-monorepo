import { describe, it, expect } from "vitest";
import { categoriesService } from "../services/categories.service";
import { CATEGORIES } from "../data/categories.data";
import type { Category } from "../types/category.type";

/** Contract test — asserts the typed shape/params-mapping before any UI
 * consumes the service (system_architecture.md §4.11). */
describe("categoriesService.list", () => {
  it("returns a PaginatedResponse<Category> shape with no params", async () => {
    const result = await categoriesService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(CATEGORIES.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("caps returned rows to per_page", async () => {
    const result = await categoriesService.list({ per_page: 2 });
    expect(result.data.length).toBeLessThanOrEqual(2);
  });

  it("narrows by search across name/code/slug", async () => {
    const result = await categoriesService.list({ search: "mobile legends" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      expect(row.name.toLowerCase()).toContain("mobile legends");
    }
  });

  it("narrows by type exactly", async () => {
    const result = await categoriesService.list({ type: "PC Game" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.type).toBe("PC Game");
  });

  it("includes both active and inactive rows in the fixtures", async () => {
    const result = await categoriesService.list({ per_page: 50 });
    expect(result.data.some((row) => row.status === "active")).toBe(true);
    expect(result.data.some((row) => row.status === "inactive")).toBe(true);
  });

  it("never includes shadcn demo-dataset content", async () => {
    const result = await categoriesService.list({ per_page: 50 });
    const banned = ["Cover Page", "Table of Contents", "Jamik Tashpulatov", "Eddie Lake"];
    for (const row of result.data) {
      for (const word of banned) {
        expect(row.name).not.toContain(word);
      }
    }
  });
});

describe("categoriesService.getById", () => {
  it("resolves the typed category for a known id", async () => {
    await expect(categoriesService.getById(CATEGORIES[0].id)).resolves.toMatchObject({ id: CATEGORIES[0].id });
  });

  it("throws for an unknown id", async () => {
    await expect(categoriesService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("categoriesService mutations", () => {
  it("create adds a category and returns it with an id/timestamps", async () => {
    const input: Omit<Category, "id" | "created_at" | "updated_at"> = {
      type: "Mobile Game",
      uid_parser: "None",
      name: "Test Game",
      code: "TESTG",
      slug: "test-game",
      status: "active",
      order_form_fields: [{ key: "user_id", required: true }],
    };
    const created = await categoriesService.create(input);
    expect(created.id).toBeTruthy();
    expect(created.name).toBe("Test Game");
    await expect(categoriesService.getById(created.id)).resolves.toMatchObject({ name: "Test Game" });
  });

  it("remove deletes a known category and throws for an unknown id", async () => {
    const created = await categoriesService.create({
      type: "Voucher",
      uid_parser: "None",
      name: "Removable",
      code: "RM",
      slug: "removable",
      status: "active",
      order_form_fields: [],
    });
    await expect(categoriesService.remove(created.id)).resolves.toBeUndefined();
    await expect(categoriesService.getById(created.id)).rejects.toThrow();
    await expect(categoriesService.remove("does-not-exist")).rejects.toThrow();
  });
});
