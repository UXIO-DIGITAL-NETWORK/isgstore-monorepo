import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantServiceCheckoutPage from "../pages/MerchantServiceCheckoutPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceCheckout, ServicePaymentChannel } from "@/types/service.type";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const service = (over: Partial<ServiceCheckout> = {}): ServiceCheckout =>
  ({
    id: 1,
    code: "uxiotopup",
    name: "Uxiotopup",
    category: "supplier",
    category_label: "Supplier",
    description: "Integrasi supplier produk digital",
    features: ["Sinkronisasi harga otomatis"],
    selling_price: 250000,
    duration_days: 30,
    is_active: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
    current_period_ends_at: null,
    projected_starts_at: "2026-08-15T00:00:00+07:00",
    projected_ends_at: "2026-09-14T00:00:00+07:00",
    has_open_invoice: false,
    open_invoice_id: null,
    ...over,
  }) as ServiceCheckout;

const subscribe = vi.fn();

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

const CHANNELS = [
  channel(),
  channel({ id: 2, payment_type: "virtual_account", channel_code: "bca_va", name: "BCA VA", fee_flat: 4000 }),
];

const mockService = (data: ServiceCheckout) =>
  vi.spyOn(hooks, "useMerchantServiceDetail").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantServiceDetail>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useSubscribeService").mockReturnValue({
    mutate: subscribe,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useSubscribeService>);
  vi.spyOn(hooks, "useServicePaymentChannels").mockReturnValue({
    data: CHANNELS,
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useServicePaymentChannels>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServiceCheckoutPage serviceId={1} />
    </QueryClientProvider>,
  );

describe("MerchantServiceCheckoutPage", () => {
  /** The window is server-computed; the page must show it, not re-derive it. */
  it("shows the price, period length and the projected window", () => {
    mockService(service());
    renderPage();

    expect(screen.getByText("Uxiotopup")).toBeInTheDocument();
    // Twice: the bill itself, and the total — no method picked, so no fee yet.
    expect(screen.getAllByText("Rp 250.000")).toHaveLength(2);
    expect(screen.getByText("30 hari")).toBeInTheDocument();
    expect(screen.getByText("15 Aug 2026 – 14 Sep 2026")).toBeInTheDocument();
  });

  /** Paying is the whole point of the screen, so it must not start ambiguous. */
  it("cannot be paid until a method is picked", () => {
    mockService(service());
    renderPage();

    expect(screen.getByRole("button", { name: "Bayar Sekarang" })).toBeDisabled();
  });

  it("creates the invoice with the chosen method and the typed note", async () => {
    const user = userEvent.setup();
    mockService(service());
    renderPage();

    await user.type(screen.getByLabelText("Catatan (opsional)"), "Butuh instalasi cepat");
    await user.click(screen.getByRole("button", { name: /QRIS/ }));
    await user.click(screen.getByRole("button", { name: "Bayar Sekarang" }));

    expect(subscribe).toHaveBeenCalledWith(
      { service_id: 1, payment_channel_id: 1, notes: "Butuh instalasi cepat" },
      expect.anything(),
    );
  });

  /**
   * The fee differs per method and is what makes two otherwise identical
   * options unequal, so the total has to follow the choice.
   */
  it("adds the chosen method's fee to the total", async () => {
    const user = userEvent.setup();
    mockService(service());
    renderPage();

    await user.click(screen.getByRole("button", { name: /BCA VA/ }));

    expect(screen.getByText("Rp 4.000")).toBeInTheDocument();
    expect(screen.getByText("Rp 254.000")).toBeInTheDocument();
  });

  /**
   * The API 422s on a second open invoice, so the page must not offer a button
   * whose only outcome is an error toast.
   */
  it("offers the existing invoice instead of confirming again", () => {
    mockService(service({ has_open_invoice: true, open_invoice_id: 41 }));
    renderPage();

    expect(screen.queryByRole("button", { name: "Bayar Sekarang" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat Invoice/ })).toHaveAttribute(
      "href",
      "/app/payment-admin/service-invoices/41",
    );
  });
});
