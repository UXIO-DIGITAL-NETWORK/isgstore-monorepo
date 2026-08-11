import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/axios";
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

  it("normalises a raw Laravel paginator for transactions", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      status: "success",
      code: 200,
      message: "ok",
      data: {
        current_page: 2,
        last_page: 5,
        per_page: 20,
        total: 93,
        data: [{ id: 1, invoice_number: "INV-1", product: "X", nett: 60000, status: "PAID", payment_channel: "QRIS", created_at: "" }],
      },
    } as never);

    const result = await merchantService.transactions({ page: 2 });

    expect(result.page).toBe(2);
    expect(result.lastPage).toBe(5);
    expect(result.total).toBe(93);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].nett).toBe(60000);
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
