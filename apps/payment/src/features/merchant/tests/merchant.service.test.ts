import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { merchantService } from "../services/merchant.service";

vi.mock("@/lib/axios");

describe("merchantService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the dashboard payload from the envelope", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: "success",
      code: 200,
      message: "ok",
      data: { saldo_aktif: 60000, saldo_pending: 0, total_penjualan: 60000, total_penarikan: 0, total_transaksi: 1 },
    } as never);

    const dashboard = await merchantService.dashboard();

    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/dashboard");
    expect(dashboard.saldo_aktif).toBe(60000);
  });

  it("normalises a raw Laravel paginator for the unified transaction feed", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: "success",
      code: 200,
      message: "ok",
      data: {
        current_page: 2,
        last_page: 5,
        per_page: 20,
        total: 93,
        data: [
          {
            type: "sale",
            id: 1,
            invoice_number: "INV-1",
            title: "X",
            direction: "in",
            amount: 60000,
            status: "PAID",
            payment_channel: "QRIS",
            created_at: "",
          },
        ],
      },
    } as never);

    const result = await merchantService.transactions({ page: 2, type: "all" });

    expect(result.page).toBe(2);
    expect(result.lastPage).toBe(5);
    expect(result.total).toBe(93);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].amount).toBe(60000);
    expect(result.rows[0].direction).toBe("in");
  });

  it("posts a withdrawal request and unwraps the created row", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      status: "success",
      code: 201,
      message: "ok",
      data: { id: 9, withdrawal_number: "WD-abc", amount: 40000, fee: 0, nett: 40000, status: "PENDING" },
    } as never);

    const created = await merchantService.createWithdrawal({
      amount: 40000,
      bank_code: "BCA",
      account_number: "123",
      account_name: "Toko",
      account_phone: "081234567890",
    });

    expect(api.post).toHaveBeenCalledWith(
      "/v1/payment-admin/withdrawals",
      expect.objectContaining({ amount: 40000, account_phone: "081234567890" }),
    );
    expect(created.status).toBe("PENDING");
  });
});

describe("merchantService — services bought from kita", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the catalogue", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(paginated([{ id: 1, code: "uxiotopup", name: "Uxiotopup" }]) as never);

    const result = await merchantService.services({ page: 1, per_page: 50 });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/services", { params: { page: 1, per_page: 50 } });
    expect(result.rows[0].code).toBe("uxiotopup");
  });

  /** The bill and its payment are opened in one request. */
  it("requests a subscription, which issues an invoice with a payment", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(
      envelope({ id: 9, invoice_number: "SINV-1", status: "UNPAID" }) as never,
    );

    const invoice = await merchantService.subscribe({ service_id: 1, payment_channel_id: 3 });

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/service-invoices", {
      service_id: 1,
      payment_channel_id: 3,
    });
    expect(invoice.status).toBe("UNPAID");
  });

  /** A VA expires long before the bill does, so re-opening is the normal case. */
  it("re-opens payment on an existing invoice", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 9, status: "UNPAID" }) as never);

    await merchantService.payInvoice(9, 2);

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/service-invoices/9/pay", {
      payment_channel_id: 2,
    });
  });

  it("lists the methods a bill may be settled with from the storefront endpoint, minus the wallet", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(
      envelope({
        channels: [
          { id: 1, name: "QRIS", channel_code: "qris", payment_type: "qris", fee_flat: 0, fee_percent: 0.7, min_amount: 0, balance: null },
          { id: 9, name: "Saldo", channel_code: "balance", payment_type: "balance", fee_flat: 0, fee_percent: 0, min_amount: 0, balance: 60000 },
        ],
      }) as never,
    );

    const channels = await merchantService.paymentChannels();

    // Reuses the storefront endpoint, unwraps `data.channels`.
    expect(api.get).toHaveBeenCalledWith("/v1/storefront/payment-channels");
    // The wallet can't pay a service bill, so it is dropped.
    expect(channels).toHaveLength(1);
    expect(channels[0].channel_code).toBe("qris");
    expect(channels.some((c) => c.channel_code === "balance")).toBe(false);
  });

  it("reads the service status page", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(
      envelope({ overall: "degraded", incidents: [], components: [] }) as never,
    );

    const status = await merchantService.serviceStatus();

    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/service-status");
    expect(status.overall).toBe("degraded");
  });
});
