import { describe, it, expect } from "vitest";
import { categoryServersService } from "../services/categoryServers.service";
import { CATEGORY_SERVERS } from "../data/category-servers.data";
import type { CategoryServer } from "../types/categoryServer.type";

/** Contract test — asserts the typed shape/params-mapping before any UI
 * consumes the service (system_architecture.md §4.11). Mirrors
 * categoryTypes.service.test.ts; §6 adds CategoryServer as a feature-local
 * entity, notably the only one in this feature with no `status`. */
describe("categoryServersService.list", () => {
  it("returns a PaginatedResponse<CategoryServer> shape with no params", async () => {
    const result = await categoryServersService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(CATEGORY_SERVERS.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("caps returned rows to per_page", async () => {
    const result = await categoryServersService.list({ per_page: 1 });
    expect(result.data.length).toBeLessThanOrEqual(1);
  });

  it("narrows by search over the name", async () => {
    const result = await categoryServersService.list({ search: "genshin" });
    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.name.toLowerCase()).toContain("genshin");
  });

  it("exposes options as an array of non-blank name/value pairs", async () => {
    const result = await categoryServersService.list({ per_page: 50 });

    for (const row of result.data) {
      expect(Array.isArray(row.options)).toBe(true);
      for (const option of row.options) {
        expect(typeof option.name).toBe("string");
        expect(option.name.trim()).not.toBe("");
        expect(typeof option.value).toBe("string");
        expect(option.value.trim()).not.toBe("");
      }
    }
    expect(result.data.some((row) => row.options.length > 0)).toBe(true);
  });

  it("has no status field — this entity has no active/inactive concept", async () => {
    const result = await categoryServersService.list({ per_page: 50 });
    for (const row of result.data) expect(row).not.toHaveProperty("status");
  });
});

describe("categoryServersService.getById", () => {
  it("resolves the typed category server for a known id", async () => {
    await expect(categoryServersService.getById(CATEGORY_SERVERS[0].id)).resolves.toMatchObject({
      id: CATEGORY_SERVERS[0].id,
    });
  });

  it("throws for an unknown id", async () => {
    await expect(categoryServersService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("categoryServersService mutations", () => {
  it("create adds a category server and preserves its options", async () => {
    const input: Omit<CategoryServer, "id" | "created_at" | "updated_at"> = {
      name: "Honkai: Star Rail",
      options: [
        { name: "Asia", value: "prod_official_asia" },
        { name: "Europe", value: "prod_official_eur" },
      ],
    };
    const created = await categoryServersService.create(input);

    expect(created.id).toBeTruthy();
    expect(created.created_at).toBeTruthy();
    expect(created.options).toHaveLength(2);
    await expect(categoryServersService.getById(created.id)).resolves.toMatchObject({
      name: "Honkai: Star Rail",
      options: input.options,
    });
  });

  it("update patches a known category server", async () => {
    const created = await categoryServersService.create({ name: "Patchable", options: [] });
    const updated = await categoryServersService.update(created.id, {
      name: "Patched",
      options: [{ name: "Global", value: "global" }],
    });

    expect(updated.name).toBe("Patched");
    expect(updated.options).toHaveLength(1);
    await expect(categoryServersService.update("does-not-exist", { name: "x" })).rejects.toThrow();
  });

  it("remove deletes a known category server and throws for an unknown id", async () => {
    const created = await categoryServersService.create({ name: "Removable", options: [] });

    await expect(categoryServersService.remove(created.id)).resolves.toBeUndefined();
    await expect(categoryServersService.getById(created.id)).rejects.toThrow();
    await expect(categoryServersService.remove("does-not-exist")).rejects.toThrow();
  });
});
