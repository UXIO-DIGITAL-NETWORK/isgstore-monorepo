import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { refundsService } from "../services/refunds.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 7,
  refund_number: "RFD-a1b2c3d4e5f6",
  method: "manual_transfer",
  status: "PENDING",
  amount: 12000,
  transaction: {
    id: 21,
    invoice_number: "INV-20260830-ABC123",
    product: "86 Diamonds",
    created_at: "2026-08-30T10:00:00.000Z",
  },
  customer: {
    user_id: null,
    name: null,
    email: "guest@example.com",
    phone: "081234567890",
    is_guest: true,
  },
  payout: {
    bank_code: "BCA",
    bank_name: "Bank Central Asia",
    account_number: "1234567890",
    account_name: "Guest Customer",
    account_phone: null,
    submitted_at: "2026-08-30T11:00:00.000Z",
    submitted_by: "customer",
  },
  claim_notified_at: "2026-08-30T10:01:00.000Z",
  processed_by: null,
  processed_at: null,
  proof_url: null,
  admin_note: null,
  reject_reason: null,
  refunded_at: null,
  settlement_reversed_at: null,
  created_at: "2026-08-30T10:00:30.000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("refundsService.list", () => {
  it("normalises the numeric id to a string for DataTable", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await refundsService.list();

    expect(result.data[0].id).toBe("7");
    expect(result.data[0].refund_number).toBe("RFD-a1b2c3d4e5f6");
  });

  it("keeps the API's own status and method vocabulary", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await refundsService.list();

    // No translation layer: a filter value can be forwarded verbatim, which is
    // what stops the transactions feature's REFUNDED/partial_refund drift from
    // repeating here.
    expect(result.data[0].status).toBe("PENDING");
    expect(result.data[0].method).toBe("manual_transfer");
  });

  it("forwards filters as the API's query parameters", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await refundsService.list({
      status: "WAITING_DETAILS",
      method: "manual_transfer",
      search: "INV-1",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      page: 2,
      per_page: 25,
    });

    expect(api.get).toHaveBeenCalledWith("/v1/refunds", {
      params: {
        status: "WAITING_DETAILS",
        method: "manual_transfer",
        search: "INV-1",
        date_from: "2026-08-01",
        date_to: "2026-08-31",
        page: 2,
        per_page: 25,
      },
    });
  });

  it("omits absent filters entirely rather than sending empty values", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await refundsService.list({ status: "PENDING" });

    expect(api.get).toHaveBeenCalledWith("/v1/refunds", { params: { status: "PENDING" } });
  });
});

describe("refundsService.statusCounts", () => {
  it("reads the dedicated endpoint and tolerates an empty body", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope({ PENDING: 3, COMPLETED: 10 }));

    expect(await refundsService.statusCounts()).toEqual({ PENDING: 3, COMPLETED: 10 });
    expect(api.get).toHaveBeenCalledWith("/v1/refunds/status-counts");

    vi.mocked(api.get).mockResolvedValue(envelope(undefined));
    expect(await refundsService.statusCounts()).toEqual({});
  });
});

describe("refundsService writes", () => {
  it("posts payout details to the admin endpoint", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow()));

    await refundsService.savePayoutDetails("7", {
      bank_code: "BCA",
      account_number: "1234567890",
      account_name: "Guest Customer",
    });

    expect(api.post).toHaveBeenCalledWith("/v1/refunds/7/payout-details", {
      bank_code: "BCA",
      account_number: "1234567890",
      account_name: "Guest Customer",
    });
  });

  it("claims a row before the transfer", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ status: "PROCESSING" })));

    const refund = await refundsService.process("7");

    expect(api.post).toHaveBeenCalledWith("/v1/refunds/7/process");
    expect(refund.status).toBe("PROCESSING");
  });

  it("sends the completion as multipart so the proof file survives", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ status: "COMPLETED" })));

    const proof = new File(["bytes"], "bukti.jpg", { type: "image/jpeg" });
    await refundsService.complete("7", { proof, note: "Transfer BCA 10:15" });

    const [url, body] = vi.mocked(api.post).mock.calls[0];
    expect(url).toBe("/v1/refunds/7/complete");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("proof")).toBe(proof);
    expect((body as FormData).get("note")).toBe("Transfer BCA 10:15");
  });

  it("completes without a proof file", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ status: "COMPLETED" })));

    await refundsService.complete("7", {});

    const body = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(body.get("proof")).toBeNull();
  });

  it("refuses to reject without a reason before reaching the network", async () => {
    await expect(refundsService.reject("7", "   ")).rejects.toThrow("A rejection reason is required");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("posts a rejection reason", async () => {
    vi.mocked(api.post).mockResolvedValue(envelope(apiRow({ status: "REJECTED" })));

    await refundsService.reject("7", "Klaim ganda");

    expect(api.post).toHaveBeenCalledWith("/v1/refunds/7/reject", { reason: "Klaim ganda" });
  });
});
