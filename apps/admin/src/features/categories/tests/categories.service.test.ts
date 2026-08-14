import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { categoriesService } from "../services/categories.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  type_id: 2,
  name: "Mobile Legends",
  sub_name: "Bang Bang",
  code: "MLBB",
  slug: "mobile-legends",
  uid_parser: "user_id",
  validasi_nickname: "mlbb",
  region: "Indonesia",
  logo_url: "http://localhost:8000/storage/categories/logos/mlbb.png",
  thumbnail_url: null,
  banner_url: null,
  description: "Top up MLBB",
  status: true,
  order_form_fields: {
    fields: [{ key: "user_id", label: "User ID", required: true }],
    customer_no_template: "{user_id}{zone_id}",
  },
  meta_title: "MLBB",
  meta_description: null,
  og_image_url: null,
  meta_keywords: ["mlbb"],
  meta_robots: "index,follow",
  type: { id: 2, name: "Games" },
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("categoriesService.list", () => {
  it("maps the API row onto the view type, including the renamed fields", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await categoriesService.list({ search: "mobile" });

    expect(api.get).toHaveBeenCalledWith("/v1/categories", { params: { search: "mobile" } });
    expect(result.data[0]).toMatchObject({
      id: "1",
      // The list shows the type's name; the form/write key on the id.
      type: "Games",
      type_id: "2",
      name: "Mobile Legends",
      account_nickname_validation: "mlbb",
      status: "active",
    });
  });

  it("maps type_id from the row even when the type relation is missing", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ type: null })]));

    const result = await categoriesService.list();

    // The Type select must still preselect by id so editing does not resubmit
    // the name and fail `exists:category_types,id`.
    expect(result.data[0].type_id).toBe("2");
  });

  it("unwraps order_form_fields to the bare field list the form edits", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await categoriesService.list();

    expect(result.data[0].order_form_fields).toEqual([{ key: "user_id", label: "User ID", required: true }]);
  });

  it("tolerates a legacy bare-array order_form_fields", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ order_form_fields: [{ key: "user_id" }] })]));

    const result = await categoriesService.list();

    expect(result.data[0].order_form_fields).toEqual([{ key: "user_id" }]);
  });

  it("falls back to the type id when the relation was not eager-loaded", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ type: null })]));

    const result = await categoriesService.list();

    expect(result.data[0].type).toBe("2");
  });
});

describe("categoriesService.update", () => {
  /**
   * `customer_no_template` builds the identifier sent to the upstream
   * supplier. It is not editable in this UI, so a naive write would drop it —
   * and orders would then fail at fulfilment, after the customer has paid.
   */
  it("carries customer_no_template through a write that only touches the fields", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await categoriesService.update("1", { order_form_fields: [{ key: "user_id", label: "UID", required: true }] });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/categories/1");
    const submitted = JSON.parse((body as FormData).get("order_form_fields") as string);
    expect(submitted.customer_no_template).toBe("{user_id}{zone_id}");
    expect(submitted.fields).toEqual([{ key: "user_id", label: "UID", required: true }]);
  });

  it("POSTs with a _method=PUT override so the multipart upload survives", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await categoriesService.update("1", { name: "MLBB" });

    expect((vi.mocked(api.post).mock.calls[0][1] as FormData).get("_method")).toBe("PUT");
  });
});

describe("categoriesService.remove", () => {
  it("deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(categoriesService.remove("1")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/categories/1");
  });
});
