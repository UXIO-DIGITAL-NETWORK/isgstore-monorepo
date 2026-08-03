import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { articleCategoriesService, articlesService } from "../services/articles.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 4,
  article_category_id: 2,
  category_label: null,
  type: "article",
  locale: "id",
  title: "Cara Top Up Diamond Lebih Hemat",
  slug: "cara-top-up-diamond-lebih-hemat",
  excerpt: "Ringkasan.",
  author_name: "Admin_Topupgame",
  body_sections: [{ heading: "Bagian", paragraphs: ["Satu.", "Dua."] }],
  image_url: null,
  is_published: true,
  is_featured: false,
  published_at: "2026-05-01T09:00:00.000000Z",
  view_count: 12,
  meta_title: null,
  meta_description: null,
  meta_keywords: ["top up"],
  meta_robots: "index,follow",
  category: { id: 2, name: "Mobile Legend", key: "mobile-legend", sort_order: 1, status: true, created_at: "", updated_at: "" },
  created_at: "2026-05-01T09:00:00.000000Z",
  updated_at: "2026-05-01T09:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("articlesService.list", () => {
  it("calls the versioned endpoint and maps the row onto the view type", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await articlesService.list({ type: "article", search: "diamond" });

    expect(api.get).toHaveBeenCalledWith("/v1/articles", { params: { type: "article", search: "diamond" } });
    expect(result.data[0]).toMatchObject({
      id: "4",
      article_category_id: "2",
      title: "Cara Top Up Diamond Lebih Hemat",
      is_published: true,
    });
    expect(result.data[0].category?.key).toBe("mobile-legend");
  });

  it("treats a null body as no sections rather than surfacing null to the editor", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ body_sections: null })]));

    const result = await articlesService.list();

    expect(result.data[0].body_sections).toEqual([]);
  });
});

describe("articlesService.create", () => {
  /**
   * Writes are multipart so the cover image can ride along, which means the
   * nested arrays have to be JSON-encoded — FormData carries strings only.
   */
  it("posts multipart with the body sections JSON-encoded", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await articlesService.create({
      article_category_id: "2",
      type: "article",
      locale: "id",
      title: "Judul Baru",
      author_name: "Admin",
      body_sections: [{ heading: "H", paragraphs: ["P1", "P2"] }],
      is_published: true,
      is_featured: false,
      meta_keywords: ["a"],
    } as never);

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    const form = body as FormData;
    expect(url).toBe("/v1/articles");
    expect(form.get("title")).toBe("Judul Baru");
    expect(form.get("article_category_id")).toBe("2");
    expect(JSON.parse(form.get("body_sections") as string)).toEqual([{ heading: "H", paragraphs: ["P1", "P2"] }]);
    expect(form.get("is_published")).toBe("1");
  });

  // A blank slug means "derive it from the title" — sending an empty string
  // would make the API try to use it.
  it("omits the slug entirely when it is blank", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await articlesService.create({ title: "X", slug: "" } as never);

    expect((vi.mocked(api.post).mock.calls[0][1] as FormData).get("slug")).toBeNull();
  });
});

describe("articlesService.update", () => {
  it("POSTs with a _method=PUT override so the image upload survives", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await articlesService.update("4", { title: "Judul Diperbarui" });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/articles/4");
    expect((body as FormData).get("_method")).toBe("PUT");
  });
});

describe("articleCategoriesService", () => {
  it("reads and writes categories as plain JSON — there is no upload here", async () => {
    vi.mocked(api.post).mockResolvedValue(
      envelope({ id: 7, name: "Promo", key: "promo", sort_order: 0, status: true, created_at: "", updated_at: "" }),
    );

    const created = await articleCategoriesService.create({ name: "Promo", key: "promo", sort_order: 0, status: true });

    expect(api.post).toHaveBeenCalledWith("/v1/article-categories", {
      name: "Promo",
      key: "promo",
      sort_order: 0,
      status: true,
    });
    expect(created.id).toBe("7");
  });
});
