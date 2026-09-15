import { describe, it, expect } from "vitest";

import { toBeritaArticle, toHomeArticle } from "@/lib/articles";
import type { ArticleModel } from "@/types/models/article.model";

/**
 * The mappers are where a wrong field name silently blanks the UI — the
 * component renders an empty string rather than failing, so nothing surfaces
 * the mistake. These pin every field the two article views read.
 */
const model = (over: Partial<ArticleModel> = {}): ArticleModel => ({
  id: 4,
  slug: "cara-top-up-diamond-lebih-hemat",
  type: "article",
  title: "Cara Top Up Diamond Lebih Hemat",
  excerpt: "Ringkasan singkat.",
  author: "Admin_Topupgame",
  image_url: "http://localhost:8000/storage/articles/images/a.png",
  published_at: "2026-05-01T09:00:00.000000Z",
  is_featured: false,
  category: { key: "mobile-legend", name: "Mobile Legend" },
  ...over,
});

describe("toBeritaArticle", () => {
  it("maps every field the berita card renders", () => {
    const result = toBeritaArticle(model(), "id");

    expect(result).toMatchObject({
      id: "4",
      slug: "cara-top-up-diamond-lebih-hemat",
      title: "Cara Top Up Diamond Lebih Hemat",
      author: "Admin_Topupgame",
      categoryKey: "mobile-legend",
      image: "http://localhost:8000/storage/articles/images/a.png",
    });
  });

  it("formats the date for display, since the view type holds a string not an ISO stamp", () => {
    const result = toBeritaArticle(model(), "id");

    expect(result.date).not.toBe("2026-05-01T09:00:00.000000Z");
    expect(result.date).toMatch(/2026/);
  });

  /**
   * The badge and the filter pill legitimately differ: a PUBG article files
   * under "lainnya" because PUBG has no pill of its own, but still badges as
   * PUBG MOBILE.
   */
  it("keeps the badge label independent of the filter key", () => {
    const result = toBeritaArticle(model({ category: { key: "lainnya", name: "PUBG Mobile" } }), "id");

    expect(result.category).toBe("PUBG Mobile");
    expect(result.categoryKey).toBe("lainnya");
  });

  it("falls back to an empty image rather than undefined, which would break the img src", () => {
    const result = toBeritaArticle(model({ image_url: null }), "id");

    expect(result.image).toBe("");
  });

  it("survives an article with no publication date", () => {
    const result = toBeritaArticle(model({ published_at: null }), "id");

    expect(result.date).toBe("");
  });

  /**
   * The pills are the API's own category list, so a key the storefront has
   * never seen belongs to a category an operator just added. Folding it into a
   * catch-all would file that article under a pill it does not match and hide
   * the new category entirely.
   */
  it("passes an unfamiliar category key through rather than folding it away", () => {
    const result = toBeritaArticle(model({ category: { key: "apex-legends", name: "Apex Legends" } }), "id");

    expect(result.categoryKey).toBe("apex-legends");
  });

  it("falls back to the catch-all only when the API sends no key at all", () => {
    const result = toBeritaArticle(model({ category: { key: null, name: null } }), "id");

    expect(result.categoryKey).toBe("lainnya");
  });
});

describe("toHomeArticle", () => {
  it("maps the slimmer shape the home rail renders", () => {
    const result = toHomeArticle(model(), "id");

    expect(result).toMatchObject({
      id: "4",
      slug: "cara-top-up-diamond-lebih-hemat",
      title: "Cara Top Up Diamond Lebih Hemat",
      category: "Mobile Legend",
    });
    // The home type has no author or categoryKey — it must not leak them.
    expect(result).not.toHaveProperty("author");
    expect(result).not.toHaveProperty("categoryKey");
  });
});
