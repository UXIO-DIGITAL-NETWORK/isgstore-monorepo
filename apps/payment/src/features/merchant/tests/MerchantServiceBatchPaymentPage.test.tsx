import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import MerchantServiceBatchPaymentPage from "../pages/MerchantServiceBatchPaymentPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceBatchPayment } from "@/types/service.type";

vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

// Canvas is not implemented in jsdom, so the QR is stubbed to a marker.
vi.mock("../hooks/useQrDataUrl", () => ({ useQrDataUrl: (p?: string | null) => (p ? "data:image/png;base64,QR" : null) }));

const attempt = (over: Partial<ServiceBatchPayment> = {}): ServiceBatchPayment => ({
  reference_id: "SRV-BATCH-1",
  channel: "QRIS",
  channel_code: "qris",
  type: "qris",
  amount: 500000,
  admin_fee: 0,
  total: 500000,
  invoice_count: 2,
  status: "PENDING",
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  is_expired: false,
  instructions: { order_no: "MP-1", qr_string: "000201-QR" },
  invoices: [
    { id: 1, invoice_number: "SINV-1", service_name: "Uxiotopup", status: "UNPAID", amount: 250000, admin_fee: 0 },
    { id: 2, invoice_number: "SINV-2", service_name: "Uxiotopup", status: "UNPAID", amount: 250000, admin_fee: 0 },
  ],
  ...over,
});

const renderPage = (data: ServiceBatchPayment) => {
  vi.spyOn(hooks, "useServicePayment").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServicePayment>);

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServiceBatchPaymentPage reference="SRV-BATCH-1" />
    </QueryClientProvider>,
  );
};

beforeEach(() => vi.clearAllMocks());

describe("MerchantServiceBatchPaymentPage", () => {
  it("shows the QR while the batch is still payable", () => {
    renderPage(attempt());

    expect(screen.getByAltText("Kode QRIS untuk pembayaran")).toBeInTheDocument();
  });

  /** The covered bills read in words here too, not as the enum we store. */
  it("labels each covered bill's status", () => {
    renderPage(attempt());

    expect(screen.getAllByText("Belum dibayar").length).toBeGreaterThan(0);
    expect(screen.queryByText("UNPAID")).not.toBeInTheDocument();
  });

  /**
   * The bug this locks: the card branched on "is it PENDING", so a SETTLED
   * batch rendered the expired wording — a successful payment labelled as a
   * failure, on the page the client lands on right after paying.
   */
  it("reports a settled batch as received, never as expired", () => {
    renderPage(attempt({ status: "PAID" }));

    expect(screen.getByText("Pembayaran diterima")).toBeInTheDocument();
    expect(screen.queryByText(/kedaluwarsa/i)).not.toBeInTheDocument();
    expect(screen.queryByAltText("Kode QRIS untuk pembayaran")).not.toBeInTheDocument();
  });

  /** A settled batch used to strand the client here with no way back. */
  it("offers a way back in every state", () => {
    renderPage(attempt({ status: "PAID" }));

    expect(screen.getByRole("link", { name: "← Kembali ke Services" })).toHaveAttribute(
      "href",
      "/app/payment-admin/services?tab=bills",
    );
  });

  /**
   * A lapsed batch cannot be re-opened from here (the client may have
   * part-paid), so the card must not render a button that does nothing — it
   * points at the bills tab instead.
   */
  it("points a lapsed batch at the bills tab instead of a dead button", () => {
    renderPage(attempt({ status: "EXPIRED", is_expired: true }));

    expect(screen.getByRole("link", { name: "Buka tab Tagihan untuk membuat pembayaran baru" })).toHaveAttribute(
      "href",
      "/app/payment-admin/services?tab=bills",
    );
    expect(screen.queryByRole("button", { name: "Buat Pembayaran" })).not.toBeInTheDocument();
  });
});
