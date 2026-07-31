import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { categoryTypesService } from "../services/categoryTypes.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 7,
  name: "Voucher",
  is_voucher: true,
  status: true,
  created_at: "2026-07-01T00:00:00.000000Z",
  updated_at: "2026-07-01T00:00:00.000000Z",
  ...over,
});

const envelope = <T>(data: T) => ({ status: "success", code: 200, message: "ok", data });

const paginated = <T>(rows: T[]) =>
  envelope({
    data: rows,
    links: { first: "/x?page=1", last: "/x?page=1", prev: null, next: null },
    meta: { current_page: 1, from: 1, last_page: 1, path: "/x", per_page: 10, to: rows.length, total: rows.length },
  });

beforeEach(() => vi.clearAllMocks());

/**
 * Contract test — asserts the request the service makes and the shape it maps
 * back onto `CategoryType`. This used to run against in-memory fixtures; the
 * service is real now, so the axios instance is the seam.
 */
describe("categoryTypesService.list", () => {
  it("calls the versioned endpoint, forwarding list params as query params", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    await categoryTypesService.list({ search: "voucher", page: 2, per_page: 25 });

    expect(api.get).toHaveBeenCalledWith("/v1/category-types", {
      params: { search: "voucher", page: 2, per_page: 25 },
    });
  });

  it("reaches through the envelope and maps rows onto the view type", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow(), apiRow({ id: 8, status: false, is_voucher: false })]));

    const result = await categoryTypesService.list();

    // Numeric API ids become strings — DataTable is generic over {id: string}.
    expect(result.data[0]).toMatchObject({ id: "7", name: "Voucher", is_voucher: true, status: "active" });
    expect(result.data[1]).toMatchObject({ id: "8", is_voucher: false, status: "inactive" });
    expect(result.meta.total).toBe(2);
  });
});

describe("categoryTypesService.getById", () => {
  it("maps a single row from the envelope", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));

    await expect(categoryTypesService.getById("7")).resolves.toMatchObject({ id: "7", name: "Voucher" });
    expect(api.get).toHaveBeenCalledWith("/v1/category-types/7");
  });
});

describe("categoryTypesService mutations", () => {
  it("create posts the API's boolean status, not the view union", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ name: "Game Pass" })));

    await categoryTypesService.create({ name: "Game Pass", is_voucher: true, status: "active" });

    expect(api.post).toHaveBeenCalledWith("/v1/category-types", {
      name: "Game Pass",
      is_voucher: true,
      status: true,
    });
  });

  it("update sends only the fields it was given", async () => {
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow({ name: "Bundle Pack" })));

    await categoryTypesService.update("7", { name: "Bundle Pack" });

    expect(api.put).toHaveBeenCalledWith("/v1/category-types/7", { name: "Bundle Pack" });
  });

  // The API's update rule marks `name` required, so a status-only PUT would
  // 422. setStatus reads the row first and resends it alongside the new status.
  it("setStatus re-sends the existing name so the required-field rule passes", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow({ name: "Voucher", is_voucher: true })));
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow({ status: false })));

    const result = await categoryTypesService.setStatus("7", "inactive");

    expect(api.put).toHaveBeenCalledWith("/v1/category-types/7", {
      name: "Voucher",
      is_voucher: true,
      status: false,
    });
    expect(result.status).toBe("inactive");
  });

  it("remove deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(categoryTypesService.remove("7")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/category-types/7");
  });
});
