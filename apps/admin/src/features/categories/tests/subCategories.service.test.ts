import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { subCategoriesService } from "../services/subCategories.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 3,
  category_id: 1,
  name: "Diamond",
  currency_name: "Diamonds",
  description: "In-game currency",
  logo: "subcategories/logos/a.png",
  logo_url: "http://localhost:8000/storage/subcategories/logos/a.png",
  status: true,
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("subCategoriesService.list", () => {
  it("calls the versioned endpoint and maps rows onto the view type", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow(), apiRow({ id: 4, status: false })]));

    const result = await subCategoriesService.list({ search: "diamond", category_id: "1" });

    expect(api.get).toHaveBeenCalledWith("/v1/sub-categories", {
      params: { search: "diamond", category_id: "1" },
    });
    expect(result.data[0]).toMatchObject({
      id: "3",
      category_id: "1",
      name: "Diamond",
      currency_name: "Diamonds",
      status: "active",
    });
    expect(result.data[1].status).toBe("inactive");
  });

  it("falls back to an empty currency name rather than surfacing null to the table", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ currency_name: null })]));

    const result = await subCategoriesService.list();

    expect(result.data[0].currency_name).toBe("");
  });
});

describe("subCategoriesService mutations", () => {
  // The logo is a file upload, so writes must be multipart — a JSON body would
  // drop the file silently.
  it("create posts multipart with the mapped field names", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await subCategoriesService.create({
      category_id: "1",
      name: "Diamond",
      currency_name: "Diamonds",
      status: "active",
    });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/sub-categories");
    expect(body).toBeInstanceOf(FormData);
    const form = body as FormData;
    expect(form.get("category_id")).toBe("1");
    expect(form.get("name")).toBe("Diamond");
    expect(form.get("currency_name")).toBe("Diamonds");
    // The API takes a boolean; the view type carries a union.
    expect(form.get("status")).toBe("1");
  });

  // PHP does not populate $_FILES from a multipart PUT body, so the update has
  // to POST with a method override or the logo never arrives.
  it("update POSTs with a _method=PUT override", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ name: "Diamond Pack" })));

    await subCategoriesService.update("3", { name: "Diamond Pack" });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/sub-categories/3");
    expect((body as FormData).get("_method")).toBe("PUT");
    expect((body as FormData).get("name")).toBe("Diamond Pack");
  });

  it("remove deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(subCategoriesService.remove("3")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/sub-categories/3");
  });
});
