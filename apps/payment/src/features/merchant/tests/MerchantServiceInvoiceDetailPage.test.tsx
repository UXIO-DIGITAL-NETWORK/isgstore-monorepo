import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantServiceInvoiceDetailPage from "../pages/MerchantServiceInvoiceDetailPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceInvoice, ServiceInvoicePayment, ServicePaymentChannel } from "@/types/service.type";

vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

// Canvas is not implemented in jsdom, so the QR is stubbed to a marker the
// test can assert on instead.
vi.mock("../hooks/useQrDataUrl", () => ({ useQrDataUrl: (p?: string | null) => (p ? "data:image/png;base64,QR" : null) }));

const reopen = vi.fn();

const channel = (over: Partial<ServicePaymentChannel> = {}): ServicePaymentChannel => ({
  id: 1,
  payment_type: "qris",
  channel_code: "qris",
  name: "QRIS",
  logo_url: null,
  description: null,
  min_amount: 0,
  fee_flat: 0,
  fee_percent: 0,
  sort_order: 0,
  ...over,
});

const payment = (over: Partial<ServiceInvoicePayment> = {}): ServiceInvoicePayment => ({
  channel: "QRIS",
  channel_code: "qris",
  type: "qris",
  amount: 250000,
  admin_fee: 0,
  total: 250000,
  status: "PENDING",
  expires_at: new Date(Date.now() + 600_000).toISOString(),
  is_expired: false,
  instructions: { order_no: "MP-1", qr_string: "000201-QR" },
  ...over,
});

const invoice = (over: Partial<ServiceInvoice> = {}): ServiceInvoice =>
  ({
    id: 9,
    invoice_number: "SINV-202608-A1B2C3",
    service: { id: 1, code: "uxiotopup", name: "Uxiotopup" },
    service_name: "Uxiotopup",
    amount: 250000,
    duration_days: 30,
    status: "UNPAID",
    due_at: "2026-08-17T00:00:00+07:00",
    notes: null,
    payment: payment(),
    verified_at: null,
    created_at: "2026-08-14T00:00:00+07:00",
    ...over,
  }) as ServiceInvoice;

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(hooks, "useMerchantInstallation").mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantInstallation>);
  vi.spyOn(hooks, "useRevealDetail").mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.spyOn(hooks, "useServicePaymentChannels").mockReturnValue({
    data: [channel(), channel({ id: 2, payment_type: "virtual_account", channel_code: "bca_va", name: "BCA VA" })],
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useServicePaymentChannels>);
  vi.spyOn(hooks, "usePayServiceInvoice").mockReturnValue({
    mutate: reopen,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.usePayServiceInvoice>);
});

const renderPage = (data: ServiceInvoice) => {
  vi.spyOn(hooks, "useMerchantServiceInvoice").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoice>);

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServiceInvoiceDetailPage invoiceId={9} />
    </QueryClientProvider>,
  );
};

describe("MerchantServiceInvoiceDetailPage", () => {
  it("renders the QR for a QRIS payment", () => {
    renderPage(invoice());

    expect(screen.getByAltText("Kode QRIS untuk pembayaran")).toBeInTheDocument();
  });

  it("renders the account number for a virtual account", () => {
    renderPage(
      invoice({
        payment: payment({
          channel: "BCA VA",
          type: "virtual_account",
          instructions: { virtual_account: "8808123456", bank_code: "BCA" },
        }),
      }),
    );

    expect(screen.getByText("8808123456")).toBeInTheDocument();
    expect(screen.queryByAltText("Kode QRIS untuk pembayaran")).not.toBeInTheDocument();
  });

  it("shows the admin fee separately from the bill", () => {
    renderPage(invoice({ payment: payment({ admin_fee: 6500, total: 256500 }) }));

    expect(screen.getByText("Biaya Admin")).toBeInTheDocument();
    expect(screen.getByText("Total Bayar")).toBeInTheDocument();
  });

  /** An expired QR is unusable, so the client must be able to ask for a new one. */
  it("offers a new payment once the attempt has lapsed", async () => {
    renderPage(invoice({ payment: payment({ is_expired: true }) }));

    expect(screen.queryByAltText("Kode QRIS untuk pembayaran")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /BCA VA/ }));
    await userEvent.click(screen.getByRole("button", { name: "Buat Pembayaran" }));

    expect(reopen).toHaveBeenCalledWith({ id: 9, paymentChannelId: 2 });
  });

  it("offers a payment when none has been opened at all", () => {
    renderPage(invoice({ payment: null }));

    expect(screen.getByText("Belum ada pembayaran yang dibuka. Pilih metode untuk melanjutkan.")).toBeInTheDocument();
  });

  it("drops the payment card once the invoice is paid", () => {
    renderPage(invoice({ status: "PAID" }));

    expect(screen.queryByAltText("Kode QRIS untuk pembayaran")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Buat Pembayaran" })).not.toBeInTheDocument();
  });

  /** The bukti-transfer flow is gone; nothing should hint at it. */
  it("shows no proof-upload affordance", () => {
    renderPage(invoice());

    expect(screen.queryByText(/Bukti Transfer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Unggah Bukti/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Instruksi Transfer/i)).not.toBeInTheDocument();
  });
});
