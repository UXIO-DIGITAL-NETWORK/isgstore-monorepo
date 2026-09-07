import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { categoryServersService } from "../services/categoryServers.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 5,
  category_id: 1,
  name: "Zone ID",
  options: [
    { id: 11, server_category_id: 5, name: "Asia", value: "2001" },
    { id: 12, server_category_id: 5, name: "Europe", value: "2002" },
  ],
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("categoryServersService.list", () => {
  it("maps the eager-loaded options down to the name/value pairs the form edits", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await categoryServersService.list({ search: "zone" });

    expect(api.get).toHaveBeenCalledWith("/v1/server-categories", { params: { search: "zone" } });
    expect(result.data[0]).toMatchObject({ id: "5", category_id: "1", name: "Zone ID" });
    expect(result.data[0].options).toEqual([
      { name: "Asia", value: "2001" },
      { name: "Europe", value: "2002" },
    ]);
  });

  it("treats a row with no options relation as having none", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ options: undefined })]));

    const result = await categoryServersService.list();

    expect(result.data[0].options).toEqual([]);
  });
});

describe("categoryServersService.create", () => {
  /**
   * Options are nested here but a separate resource in the API, so a write has
   * to fan out to /server-category-options once the parent exists.
   */
  it("creates the server, then posts each option against the new id", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope(apiRow({ options: [] })));
    vi.mocked(api.get).mockResolvedValue(paginated([]));
    vi.mocked(api.post).mockResolvedValue(envelope({}));

    await categoryServersService.create({
      category_id: "1",
      name: "Zone ID",
      options: [{ name: "Asia", value: "2001" }],
    });

    expect(vi.mocked(api.post).mock.calls[0]).toEqual(["/v1/server-categories", { category_id: 1, name: "Zone ID" }]);
    expect(vi.mocked(api.post).mock.calls[1]).toEqual([
      "/v1/server-category-options",
      { server_category_id: 5, name: "Asia", value: "2001" },
    ]);
  });

  it("sends category_id as a number, since a string FK misbehaves in the DTO casts", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ options: [] })));

    await categoryServersService.create({ category_id: "1", name: "Zone ID", options: [] });

    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ category_id: 1 });
  });
});

describe("categoryServersService.update", () => {
  it("replaces the option set, deleting the ones the API already had", async () => {
    vi.mocked(api.get)
      // getById, to carry category_id/name across a partial write
      .mockResolvedValueOnce(envelope(apiRow()))
      // the existing options to clear
      .mockResolvedValueOnce(paginated([{ id: 11, server_category_id: 5, name: "Asia", value: "2001" }]));
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow({ options: [] })));
    vi.mocked(api.delete).mockResolvedValue(envelope(null));
    vi.mocked(api.post).mockResolvedValue(envelope({}));

    const result = await categoryServersService.update("5", { options: [{ name: "Asia Pacific", value: "2003" }] });

    expect(api.delete).toHaveBeenCalledWith("/v1/server-category-options/11");
    expect(api.post).toHaveBeenCalledWith("/v1/server-category-options", {
      server_category_id: 5,
      name: "Asia Pacific",
      value: "2003",
    });
    expect(result.options).toEqual([{ name: "Asia Pacific", value: "2003" }]);
  });

  // The API marks name and category_id required, so an options-only edit would
  // 422 without resending what the row already has.
  it("resends the existing name and category on a partial write", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope(apiRow())).mockResolvedValueOnce(paginated([]));
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow()));

    await categoryServersService.update("5", { options: [] });

    expect(api.put).toHaveBeenCalledWith("/v1/server-categories/5", { category_id: 1, name: "Zone ID" });
  });
});

describe("categoryServersService.remove", () => {
  it("deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(categoryServersService.remove("5")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/server-categories/5");
  });
});
