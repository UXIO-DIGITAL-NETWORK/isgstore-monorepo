import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { financeService } from "../services/finance.service";

vi.mock("@/lib/axios");

/**
 * These pin the URLs, because a typo in a path fails at runtime with a 404 the
 * UI renders as an empty table — indistinguishable from "no data yet".
 */
describe("financeService — services, invoices, subscriptions, incidents", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalises a Resource collection for the services list", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(
      paginated([{ id: 1, code: "uxiotopup", name: "Uxiotopup", price: 250000, duration_days: 30 }], {
        total: 5,
        per_page: 20,
      }) as never,
    );

    const result = await financeService.services({ page: 1, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/services", { params: { page: 1, per_page: 20 } });
    expect(result.total).toBe(5);
    expect(result.rows[0].code).toBe("uxiotopup");
  });

  it("posts a new service", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 2, code: "domain" }) as never);

    await financeService.createService({
      code: "domain",
      name: "Domain",
      category: "infrastructure",
      cost_price: 120000,
      selling_price: 200000,
      duration_days: 365,
      is_active: true,
    });

    expect(api.post).toHaveBeenCalledWith(
      "/v1/payment-internal/services",
      expect.objectContaining({ code: "domain", duration_days: 365 }),
    );
  });

  it("lists service invoices", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(paginated([{ id: 9, invoice_number: "SINV-1" }]) as never);

    const result = await financeService.serviceInvoices({ page: 1, status: "WAITING_CONFIRMATION" });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/service-invoices", {
      params: { page: 1, status: "WAITING_CONFIRMATION" },
    });
    expect(result.rows[0].invoice_number).toBe("SINV-1");
  });

  it("confirms an invoice by id", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 9, status: "PAID" }) as never);

    const confirmed = await financeService.confirmServiceInvoice(9);

    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/service-invoices/9/confirm", {});
    expect(confirmed.status).toBe("PAID");
  });

  it("rejects an invoice with a reason", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 9, status: "REJECTED" }) as never);

    await financeService.rejectServiceInvoice(9, "Nominal tidak sesuai");

    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/service-invoices/9/reject", {
      reason: "Nominal tidak sesuai",
    });
  });

  it("lists subscriptions and cancels one", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(paginated([{ id: 4, status: "ACTIVE" }]) as never);
    await financeService.serviceSubscriptions({ page: 1 });
    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/service-subscriptions", { params: { page: 1 } });

    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 4, status: "CANCELLED" }) as never);
    await financeService.cancelSubscription(4);
    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/service-subscriptions/4/cancel", {});
  });

  it("creates an incident against exactly one target", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 2 }) as never);

    await financeService.createIncident({
      title: "QRIS lambat",
      payment_channel_id: 3,
      severity: "MAJOR",
      status: "INVESTIGATING",
      message: "Settlement tertunda",
      started_at: "2026-08-14T09:00:00.000Z",
    });

    expect(api.post).toHaveBeenCalledWith(
      "/v1/payment-internal/incidents",
      expect.objectContaining({ payment_channel_id: 3, severity: "MAJOR" }),
    );
  });

  it("reads one service invoice by id", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope({ id: 9, invoice_number: "SINV-1" }) as never);

    await financeService.serviceInvoice(9);

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/service-invoices/9");
  });

  /**
   * One installation row, two access paths. A typo in either sends the operator
   * to a 404 the UI renders as an empty section — indistinguishable from
   * "nothing prepared yet".
   */
  it("reads an installation scoped to an invoice", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope(null) as never);

    await financeService.installation({ by: "invoice", id: 9 });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/service-invoices/9/installation");
  });

  it("reads an installation scoped to a subscription", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope(null) as never);

    await financeService.installation({ by: "subscription", id: 4 });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/service-subscriptions/4/installation");
  });

  it("upserts an installation scoped to an invoice", async () => {
    vi.mocked(api.put).mockResolvedValueOnce(envelope({ id: 7 }) as never);

    await financeService.upsertInstallation({ by: "invoice", id: 9 }, { starts_at: "2026-08-15" });

    expect(api.put).toHaveBeenCalledWith("/v1/payment-internal/service-invoices/9/installation", {
      starts_at: "2026-08-15",
    });
  });
});

describe("financeService — internal withdrawals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an internal withdrawal with no merchant on the payload", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(
      envelope({ id: 1, withdrawal_number: "WD-abc", status: "PENDING" }) as never,
    );

    const payload = {
      amount: 40000,
      bank_code: "BCA",
      account_number: "1234567890",
      account_name: "Kas Internal",
      account_phone: "08123456789",
    };
    const result = await financeService.createInternalWithdrawal(payload);

    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/withdrawals", payload);
    expect(result.withdrawal_number).toBe("WD-abc");
  });

  it("reads the available platform balance", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope({ available: 75000 }) as never);

    const result = await financeService.platformBalance();

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/platform-balance");
    expect(result.available).toBe(75000);
  });

  it("approves with just an id, defaulting to monetapay and no proof", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 5, status: "APPROVED" }) as never);

    await financeService.approve(5);

    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/withdrawals/5/approve", { method: "monetapay" });
  });

  it("approves manually as multipart when a proof file is attached", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 5, status: "SETTLED" }) as never);

    const proof = new File(["x"], "bukti.jpg", { type: "image/jpeg" });
    await financeService.approve(5, { method: "manual", proof });

    expect(api.post).toHaveBeenCalledWith("/v1/payment-internal/withdrawals/5/approve", expect.any(FormData));
    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get("method")).toBe("manual");
    expect(form.get("proof")).toBe(proof);
  });
});

describe("financeService — channel fees", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the channel list", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(envelope([{ id: 4, channel_code: "qris" }]) as never);

    await financeService.channels();

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/channels");
  });

  it("reads whether the Hub owns the fee schedule", async () => {
    // Static path — if it ever bound as {paymentChannel} the page would silently
    // decide it is editable and only find out on a refused save.
    vi.mocked(api.get).mockResolvedValueOnce(
      envelope({ hub_managed: true, managed_note: "Channel dikelola di Hub." }) as never,
    );

    const meta = await financeService.channelMeta();

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/channels/meta");
    expect(meta.hub_managed).toBe(true);
  });

  it("saves one channel's fees", async () => {
    vi.mocked(api.put).mockResolvedValueOnce(envelope({ id: 4, tax_percent: 12 }) as never);

    await financeService.updateChannel(4, { tax_percent: 12 });

    expect(api.put).toHaveBeenCalledWith("/v1/payment-internal/channels/4", { tax_percent: 12 });
  });
});
