import { describe, it, expect } from "vitest";
import { categoryTypesService } from "../services/categoryTypes.service";
import { CATEGORY_TYPES } from "../data/category-types.data";
import type { CategoryType } from "../types/categoryType.type";

/** Contract test — asserts the typed shape/params-mapping before any UI
 * consumes the service (system_architecture.md §4.11). Mirrors
 * subCategories.service.test.ts; §6 adds CategoryType as a feature-local
 * entity. */
describe("categoryTypesService.list", () => {
  it("returns a PaginatedResponse<CategoryType> shape with no params", async () => {
    const result = await categoryTypesService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(CATEGORY_TYPES.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("caps returned rows to per_page", async () => {
    const result = await categoryTypesService.list({ per_page: 2 });
    expect(result.data.length).toBeLessThanOrEqual(2);
  });

  it("narrows by search over the name", async () => {
    const result = await categoryTypesService.list({ search: "voucher" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.name.toLowerCase()).toContain("voucher");
  });

  it("covers both voucher states in the fixtures", async () => {
    const result = await categoryTypesService.list({ per_page: 50 });
    expect(result.data.some((row) => row.is_voucher)).toBe(true);
    expect(result.data.some((row) => !row.is_voucher)).toBe(true);
  });

  it("covers both statuses in the fixtures", async () => {
    const result = await categoryTypesService.list({ per_page: 50 });
    expect(result.data.some((row) => row.status === "active")).toBe(true);
    expect(result.data.some((row) => row.status === "inactive")).toBe(true);
  });

  it("never carries the shadcn demo dataset's status vocabulary or content", async () => {
    const result = await categoryTypesService.list({ per_page: 50 });
    const banned = ["In Process", "Done", "Cover Page", "Table of Contents", "Jamik Tashpulatov", "Eddie Lake"];
    for (const row of result.data) {
      for (const word of banned) expect(row.name).not.toContain(word);
      // The only two statuses that exist — "In Process" leaked into the
      // reference's own screenshots (product_requirements.md §4.5).
      expect(["active", "inactive"]).toContain(row.status);
    }
  });
});

describe("categoryTypesService.getById", () => {
  it("resolves the typed category type for a known id", async () => {
    await expect(categoryTypesService.getById(CATEGORY_TYPES[0].id)).resolves.toMatchObject({
      id: CATEGORY_TYPES[0].id,
    });
  });

  it("throws for an unknown id", async () => {
    await expect(categoryTypesService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("categoryTypesService mutations", () => {
  it("create adds a category type and returns it with an id/timestamps", async () => {
    const input: Omit<CategoryType, "id" | "created_at" | "updated_at"> = {
      name: "Game Pass",
      is_voucher: true,
      status: "active",
    };
    const created = await categoryTypesService.create(input);

    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();
    expect(created.is_voucher).toBe(true);
    await expect(categoryTypesService.getById(created.id)).resolves.toMatchObject({ name: "Game Pass" });
  });

  it("update patches a known category type", async () => {
    const created = await categoryTypesService.create({ name: "Bundle", is_voucher: false, status: "active" });
    const updated = await categoryTypesService.update(created.id, { name: "Bundle Pack" });

    expect(updated.name).toBe("Bundle Pack");
    await expect(categoryTypesService.update("does-not-exist", { name: "x" })).rejects.toThrow();
  });

  it("setStatus flips the status and rejects an unknown id", async () => {
    const created = await categoryTypesService.create({ name: "Toggleable", is_voucher: false, status: "active" });

    await expect(categoryTypesService.setStatus(created.id, "inactive")).resolves.toMatchObject({
      status: "inactive",
    });
    await expect(categoryTypesService.setStatus(created.id, "active")).resolves.toMatchObject({ status: "active" });
    await expect(categoryTypesService.setStatus("does-not-exist", "inactive")).rejects.toThrow();
  });

  it("remove deletes a known category type and throws for an unknown id", async () => {
    const created = await categoryTypesService.create({ name: "Removable", is_voucher: false, status: "active" });

    await expect(categoryTypesService.remove(created.id)).resolves.toBeUndefined();
    await expect(categoryTypesService.getById(created.id)).rejects.toThrow();
    await expect(categoryTypesService.remove("does-not-exist")).rejects.toThrow();
  });
});
