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
    });

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/withdrawals", expect.objectContaining({ amount: 40000 }));
    expect(created.status).toBe("PENDING");
  });
});

describe("merchantService — services bought from kita", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists the catalogue", async () => {
    vi.mocked(api.get).mockResolvedValueOnce(paginated([{ id: 1, code: "digiflazz", name: "Digiflazz" }]) as never);

    const result = await merchantService.services({ page: 1, per_page: 50 });

    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/services", { params: { page: 1, per_page: 50 } });
    expect(result.rows[0].code).toBe("digiflazz");
  });

  it("requests a subscription, which issues an invoice", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(
      envelope({ id: 9, invoice_number: "SINV-1", status: "UNPAID" }) as never,
    );

    const invoice = await merchantService.subscribe({ service_id: 1 });

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/service-invoices", { service_id: 1 });
    expect(invoice.status).toBe("UNPAID");
  });

  /**
   * Multipart, not JSON — the backend rule is `file`, so a JSON body would fail
   * validation rather than upload.
   */
  it("uploads the bukti transfer as FormData", async () => {
    vi.mocked(api.post).mockResolvedValueOnce(envelope({ id: 9, status: "WAITING_CONFIRMATION" }) as never);

    const proof = new File(["proof"], "bukti.png", { type: "image/png" });
    await merchantService.uploadProof(9, proof);

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/service-invoices/9/proof", expect.any(FormData));

    const form = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(form.get("proof")).toBe(proof);
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
