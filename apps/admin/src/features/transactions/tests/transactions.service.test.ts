import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { transactionsService } from "../services/transactions.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  invoice_number: "ZP2607016UJFJVSHCJ",
  user_id: 1001,
  guest_contact: null,
  target_uid: "1453734692",
  target_server: "16057",
  amount_fee: 0,
  amount_total: 4752,
  margin: 47,
  status: "COMPLETED",
  sn: "SN-123",
  proof_url: null,
  user: { id: 1001, name: "Randy Galang", phone: "+629876543210", avatar_url: null },
  product: { id: 9, name: "19 Diamond", category: { id: 4, name: "Mobile Legends" } },
  payment: { status: "3" },
  payment_channel: { id: 2, name: "Credits" },
  created_at: "2026-07-01T14:56:37.000Z",
  updated_at: "2026-07-01T14:58:00.000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("transactionsService.list", () => {
  it("maps the API row onto the feature's transaction shape", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await transactionsService.list({});

    expect(result.data[0]).toMatchObject({
      id: "1",
      invoice_no: "ZP2607016UJFJVSHCJ",
      invoice_status: "success",
      payment_status: "success",
      cost: 4752,
      profit: 47,
      payment_method: "Credits",
      target_ref: "1453734692 / 16057",
    });
    expect(result.data[0].customer).toMatchObject({ name: "Randy Galang", user_id: 1001 });
    expect(result.data[0].game.name).toBe("Mobile Legends");
  });

  it("carries the checked username through as the nickname", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ target_nickname: "ProPlayerFF" })]));

    const result = await transactionsService.list({});

    expect(result.data[0].nickname).toBe("ProPlayerFF");
  });

  // PAID means the customer has paid but the supplier has not started, which
  // is exactly what the Pending pill means to an operator.
  it("folds PAID into pending and EXPIRED into failed", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow({ status: "PAID" }), apiRow({ id: 2, status: "EXPIRED" })]));

    const result = await transactionsService.list({});

    expect(result.data[0].invoice_status).toBe("pending");
    expect(result.data[1].invoice_status).toBe("failed");
  });

  it("names a guest from the transaction's own contact, since there is no user row", async () => {
    vi.mocked(api.get).mockResolvedValue(
      paginated([apiRow({ user: null, user_id: null, guest_contact: "+628111222333" })]),
    );

    const result = await transactionsService.list({});

    expect(result.data[0].customer).toMatchObject({ user_id: null, name: "Guest", phone: "+628111222333" });
  });

  it("translates the filter bar's camelCase params into the API's snake_case", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await transactionsService.list({ userId: "5", invoiceStatus: "success", startDate: "2026-07-01", page: 2 });

    expect(vi.mocked(api.get).mock.calls[0][1]?.params).toMatchObject({
      user_id: "5",
      status: "COMPLETED",
      start_date: "2026-07-01",
      page: 2,
    });
  });

  /**
   * The backend only sorts by columns it has whitelisted. Passing a joined
   * column through would silently sort by created_at instead, which reads as
   * a broken header rather than an unsupported one.
   */
  it("drops a sort on a column the API cannot sort by", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await transactionsService.list({ sortBy: "user", sortDir: "asc" });

    expect(vi.mocked(api.get).mock.calls[0][1]?.params).not.toHaveProperty("sort_by");
  });

  it("maps a sortable column onto its API column name", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await transactionsService.list({ sortBy: "cost", sortDir: "desc" });

    expect(vi.mocked(api.get).mock.calls[0][1]?.params).toMatchObject({ sort_by: "amount_total", sort_dir: "desc" });
  });

  it("maps the customer email from the user, falling back to the checkout contact_email", async () => {
    vi.mocked(api.get).mockResolvedValue(
      paginated([apiRow({ user: { id: 1001, name: "Randy", phone: "p", email: "user@example.com", avatar_url: null } })]),
    );
    expect((await transactionsService.list({})).data[0].customer.email).toBe("user@example.com");

    vi.mocked(api.get).mockResolvedValue(
      paginated([apiRow({ user: null, user_id: null, contact_email: "guest@example.com" })]),
    );
    expect((await transactionsService.list({})).data[0].customer.email).toBe("guest@example.com");
  });
});

describe("transactionsService.getById", () => {
  it("fetches by id directly when the ref is numeric", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));

    await transactionsService.getById("1");

    expect(api.get).toHaveBeenCalledWith("/v1/transactions/1");
  });

  // The edit route is keyed on the invoice number, but the API binds the
  // numeric id — so a non-numeric ref has to be resolved through search.
  it("resolves an invoice number through a search instead of 404ing", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await transactionsService.getById("ZP2607016UJFJVSHCJ");

    expect(api.get).toHaveBeenCalledWith("/v1/transactions", {
      params: { search: "ZP2607016UJFJVSHCJ", per_page: 1 },
    });
    expect(result.invoice_no).toBe("ZP2607016UJFJVSHCJ");
  });

  it("throws when an invoice number matches nothing", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await expect(transactionsService.getById("NOPE")).rejects.toThrow();
  });
});

describe("transactionsService.getStatusCounts", () => {
  it("renames the API's failed_provider onto the pill's key", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ pending: 12, processing: 32, failed_provider: 8 }));

    await expect(transactionsService.getStatusCounts()).resolves.toEqual({
      pending: 12,
      processing: 32,
      failed: 8,
    });
  });
});

describe("transactionsService actions", () => {
  it("refund requires a reason and posts it", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(null));

    await expect(transactionsService.refund("1", "   ")).rejects.toThrow("A refund reason is required");

    await transactionsService.refund("1", "duplicate order");
    expect(api.post).toHaveBeenCalledWith("/v1/transactions/1/refund", { reason: "duplicate order" });
  });

  it("resendCallback, retryInvoice and resendReceipt hit their own endpoints", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(null));

    await transactionsService.resendCallback("1");
    await transactionsService.retryInvoice("1");
    await transactionsService.resendReceipt("1");

    expect(api.post).toHaveBeenCalledWith("/v1/transactions/1/resend-callback");
    expect(api.post).toHaveBeenCalledWith("/v1/transactions/1/retry");
    expect(api.post).toHaveBeenCalledWith("/v1/transactions/1/resend-receipt");
  });

  it("exportTransactions requests a CSV blob for the filtered set, without pagination", async () => {
    vi.mocked(api.get).mockResolvedValue(new Blob(["a,b"], { type: "text/csv" }));

    await transactionsService.exportTransactions({ search: "foo", invoiceStatus: "pending", page: 2, per_page: 10 });

    const call = vi.mocked(api.get).mock.calls.at(-1);
    expect(call?.[0]).toBe("/v1/transactions/export");
    expect(call?.[1]?.responseType).toBe("blob");
    expect(call?.[1]?.params).toMatchObject({ format: "csv", search: "foo", status: "PENDING" });
    expect(call?.[1]?.params).not.toHaveProperty("page");
    expect(call?.[1]?.params).not.toHaveProperty("per_page");
  });

  it("getRecap maps the breakdown and derives totals when the API omits them", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope({
        generated_at: "2026-07-01T00:00:00.000Z",
        breakdown: [
          { label: "ML", count: 2, revenue: 1000 },
          { label: "FF", count: 3, revenue: 2000 },
        ],
      }),
    );

    const recap = await transactionsService.getRecap("monthly");

    const call = vi.mocked(api.get).mock.calls.at(-1);
    expect(call?.[0]).toBe("/v1/transactions/recap");
    expect(call?.[1]?.params).toMatchObject({ period: "monthly" });
    expect(recap.rows).toHaveLength(2);
    expect(recap.totals).toEqual({ count: 5, revenue: 3000 });
  });

  it("remove deletes by id", async () => {
    vi.mocked(api.delete).mockResolvedValue(envelope(null));

    await expect(transactionsService.remove("1")).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith("/v1/transactions/1");
  });
});

describe("transactionsService.edit", () => {
  // The API marks amount_base and status required on update, so the edit
  // form's three fields alone would 422.
  it("merges the form's fields onto the current row before writing", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(apiRow()));
    vi.mocked(api.put).mockResolvedValue(envelope(apiRow({ status: "PROCESSING" })));

    const form = new FormData();
    form.append("invoiceStatus", "processing");
    form.append("serialNumber", "SN-999");

    await transactionsService.edit("1", form);

    expect(api.put).toHaveBeenCalledWith("/v1/transactions/1", {
      amount_base: 4752,
      amount_fee: 0,
      amount_total: 4752,
      status: "PROCESSING",
      sn: "SN-999",
    });
  });
});
