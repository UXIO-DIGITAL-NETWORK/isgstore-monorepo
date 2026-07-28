import { describe, it, expect } from "vitest";
import { productsService } from "../services/products.service";
import { PRODUCTS } from "../data/products.data";
import { CATEGORY_OPTIONS, PRICE_RANGE_OPTIONS } from "../data/select-options.data";
import type { ProductStatus } from "../types/product.type";

const STATUSES: ProductStatus[] = ["active", "inactive"];

/**
 * Contract test — pins the typed shape and the params mapping before any UI
 * consumes the service (system_architecture.md §4.11).
 *
 * Product has no §4.x PRD spec; §6 gives the entity brief
 * (`id, game_id, name, cost_price, selling_price, provider_sku?, is_available`)
 * and the rest is read off the supplied reference. The inferences that test
 * below are deliberate and flagged in §4.6: `game_name` is denormalized (no
 * Game service exists), and the reference's "All Price" filter has no visible
 * options, so it is modelled as price-range buckets.
 */
describe("productsService.list", () => {
  it("returns a PaginatedResponse<Product> shape with no params", async () => {
    const result = await productsService.list();

    expect(Array.isArray(result.data)).toBe(true);
    expect(result.meta).toMatchObject({ current_page: 1, per_page: 10 });
    expect(result.meta.total).toBe(PRODUCTS.length);
    expect(result.meta.from).toBe(1);
    expect(result.meta.to).toBe(result.data.length);
    expect(result.links).toHaveProperty("first");
    expect(result.links).toHaveProperty("last");
  });

  it("reports a real total, not the reference's 9999999 placeholder", async () => {
    // The reference footer reads "1-10 of 9999999 transactions" — the same
    // copy-pasted string every Category tab shipped. The count is real here.
    const result = await productsService.list();
    expect(result.meta.total).not.toBe(9999999);
    expect(result.meta.total).toBeGreaterThan(0);
  });

  it("paginates: page 2 continues where page 1 stopped", async () => {
    const first = await productsService.list({ page: 1, per_page: 10 });
    const second = await productsService.list({ page: 2, per_page: 10 });

    expect(first.data).toHaveLength(10);
    expect(second.data.length).toBeGreaterThan(0);
    expect(second.meta.current_page).toBe(2);
    expect(second.meta.from).toBe(11);
    expect(first.meta.last_page).toBeGreaterThan(1);

    const firstIds = first.data.map((row) => row.id);
    for (const row of second.data) expect(firstIds).not.toContain(row.id);
  });

  it("caps returned rows to per_page", async () => {
    const result = await productsService.list({ per_page: 3 });
    expect(result.data).toHaveLength(3);
  });

  it("narrows by search over the product name, code and game", async () => {
    const result = await productsService.list({ search: "diamond", per_page: 50 });

    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      expect(`${row.name} ${row.code} ${row.game_name}`.toLowerCase()).toContain("diamond");
    }
  });

  it("narrows by the category filter behind the toolbar's category select", async () => {
    const category = CATEGORY_OPTIONS[0].value;
    const result = await productsService.list({ category, per_page: 50 });

    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) expect(row.category_name).toBe(category);
  });

  it("narrows by a price bucket, matching on any variant's price", async () => {
    const bucket = PRICE_RANGE_OPTIONS.find((option) => option.value === "10k-50k");
    expect(bucket).toBeDefined();

    const result = await productsService.list({ price: bucket!.value, per_page: 50 });

    expect(result.data.length).toBeGreaterThan(0);
    for (const row of result.data) {
      const inBucket = row.variants.some(
        (variant) => variant.price >= bucket!.min && (bucket!.max === undefined || variant.price < bucket!.max),
      );
      expect(inBucket).toBe(true);
    }
  });

  it("combines filters rather than letting the last one win", async () => {
    const category = CATEGORY_OPTIONS[0].value;
    const result = await productsService.list({ category, search: "zzz-no-such-product", per_page: 50 });
    expect(result.data).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.from).toBeNull();
    expect(result.meta.to).toBeNull();
  });
});

describe("products fixtures", () => {
  it("match the Product type, including both status axes", async () => {
    const result = await productsService.list({ per_page: 50 });

    for (const row of result.data) {
      expect(typeof row.id).toBe("string");
      expect(row.name.trim()).not.toBe("");
      expect(row.code.trim()).not.toBe("");
      expect(row.game_id.trim()).not.toBe("");
      expect(row.game_name.trim()).not.toBe("");
      expect(row.category_name.trim()).not.toBe("");
      expect(STATUSES).toContain(row.status);
      // The reference stacks two badges per row. §4.6 models them as two
      // separate axes: lifecycle status and storefront availability.
      expect(typeof row.is_available).toBe("boolean");
    }
  });

  it("carry at least one priced variant, each with its own status", async () => {
    const result = await productsService.list({ per_page: 50 });

    for (const row of result.data) {
      expect(row.variants.length).toBeGreaterThan(0);
      for (const variant of row.variants) {
        expect(variant.name.trim()).not.toBe("");
        expect(variant.price).toBeGreaterThan(0);
        expect(STATUSES).toContain(variant.status);
      }
    }
  });

  it("exercise both values of each status axis, so neither badge is untested", async () => {
    const result = await productsService.list({ per_page: 50 });

    expect(result.data.some((row) => row.status === "active")).toBe(true);
    expect(result.data.some((row) => row.status === "inactive")).toBe(true);
    expect(result.data.some((row) => row.is_available)).toBe(true);
    expect(result.data.some((row) => !row.is_available)).toBe(true);
  });

  it("store raw ISO timestamps, never pre-baked display strings", async () => {
    const result = await productsService.list({ per_page: 50 });

    for (const row of result.data) {
      expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(Number.isNaN(Date.parse(row.created_at))).toBe(false);
      expect(Number.isNaN(Date.parse(row.updated_at))).toBe(false);
    }
  });

  it("carry no shadcn demo-dataset leakage", async () => {
    // The same stock data-table example bled into all five Category
    // references; this is the check that caught it there.
    const banned = ["Cover Page", "Table of Contents", "Executive Summary", "Jamik Tashpulatov", "Eddie Lake"];
    const serialized = JSON.stringify(PRODUCTS);

    for (const term of banned) expect(serialized).not.toContain(term);
  });

  it("keep every category_name and price bucket reachable from the toolbar selects", async () => {
    const optionValues = CATEGORY_OPTIONS.map((option) => option.value);
    for (const row of PRODUCTS) expect(optionValues).toContain(row.category_name);

    // A bucket nothing can match would render as a dead filter.
    for (const bucket of PRICE_RANGE_OPTIONS) {
      const matched = await productsService.list({ price: bucket.value, per_page: 50 });
      expect(matched.data.length).toBeGreaterThan(0);
    }
  });
});

describe("productsService.getById", () => {
  it("resolves the typed product for a known id", async () => {
    await expect(productsService.getById(PRODUCTS[0].id)).resolves.toMatchObject({ id: PRODUCTS[0].id });
  });

  it("throws for an unknown id", async () => {
    await expect(productsService.getById("does-not-exist")).rejects.toThrow();
  });
});

describe("productsService.remove", () => {
  it("deletes a known product and throws for an unknown id", async () => {
    const target = PRODUCTS[PRODUCTS.length - 1].id;

    await expect(productsService.remove(target)).resolves.toBeUndefined();
    await expect(productsService.getById(target)).rejects.toThrow();
    await expect(productsService.remove("does-not-exist")).rejects.toThrow();
  });
});
