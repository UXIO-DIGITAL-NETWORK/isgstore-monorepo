import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantServiceCheckoutPage from "../pages/MerchantServiceCheckoutPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceCheckout } from "@/types/service.type";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const service = (over: Partial<ServiceCheckout> = {}): ServiceCheckout =>
  ({
    id: 1,
    code: "digiflazz",
    name: "Digiflazz",
    category: "supplier",
    category_label: "Supplier",
    description: "Integrasi supplier produk digital",
    features: ["Sinkronisasi harga otomatis"],
    price: 250000,
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

    expect(screen.getByText("Digiflazz")).toBeInTheDocument();
    expect(screen.getByText("Rp 250.000")).toBeInTheDocument();
    expect(screen.getByText("30 hari")).toBeInTheDocument();
    expect(screen.getByText("15 Aug 2026 – 14 Sep 2026")).toBeInTheDocument();
  });

  it("creates the invoice with the typed note", async () => {
    const user = userEvent.setup();
    mockService(service());
    renderPage();

    await user.type(screen.getByLabelText("Catatan (opsional)"), "Butuh instalasi cepat");
    await user.click(screen.getByRole("button", { name: "Konfirmasi & Buat Invoice" }));

    expect(subscribe).toHaveBeenCalledWith(
      { service_id: 1, notes: "Butuh instalasi cepat" },
      expect.anything(),
    );
  });

  /**
   * The API 422s on a second open invoice, so the page must not offer a button
   * whose only outcome is an error toast.
   */
  it("offers the existing invoice instead of confirming again", () => {
    mockService(service({ has_open_invoice: true, open_invoice_id: 41 }));
    renderPage();

    expect(screen.queryByRole("button", { name: "Konfirmasi & Buat Invoice" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Lihat Invoice/ })).toHaveAttribute(
      "href",
      "/app/payment-admin/service-invoices/41",
    );
  });
});
