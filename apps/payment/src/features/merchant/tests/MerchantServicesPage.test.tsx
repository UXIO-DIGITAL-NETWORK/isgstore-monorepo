import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantServicesPage from "../pages/MerchantServicesPage";
import * as hooks from "../hooks/useMerchant";

// The page now renders internal router links; stub them to plain anchors so
// this stays a unit test of the page, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const list = <T,>(rows: T[]) => ({ rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 });

const service = {
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
};

const invoice = {
  id: 9,
  invoice_number: "SINV-202608-A1B2C3",
  service_name: "Uxiotopup",
  amount: 250000,
  duration_days: 30,
  status: "UNPAID",
  due_at: "2026-08-17T00:00:00+07:00",
  notes: null,
  proof_uploaded_at: null,
  verified_at: null,
  created_at: "",
};

const subscription = {
  id: 4,
  service: { id: 1, code: "uxiotopup", name: "Uxiotopup", category: "supplier" },
  starts_at: "2026-08-15T00:00:00+07:00",
  ends_at: "2026-09-14T00:00:00+07:00",
  days_remaining: 30,
  status: "ACTIVE",
  created_at: "",
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(hooks, "useMerchantSubscriptions").mockReturnValue({
    data: list([subscription]),
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantSubscriptions>);

  vi.spyOn(hooks, "useMerchantServices").mockReturnValue({
    data: list([service]),
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantServices>);

  vi.spyOn(hooks, "useMerchantServiceInvoices").mockReturnValue({
    data: list([]),
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoices>);

  // The page now also reads the Hub's plan, for the summary above the cards and
  // for the Tagihan tab.
  vi.spyOn(hooks, "useServicePlan").mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServicePlan>);

  vi.spyOn(hooks, "useServicePaymentChannels").mockReturnValue({
    data: [],
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useServicePaymentChannels>);

  vi.spyOn(hooks, "usePayInvoiceBatch").mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof hooks.usePayInvoiceBatch>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServicesPage />
    </QueryClientProvider>,
  );

describe("MerchantServicesPage", () => {
  it("shows the active period of a subscription", () => {
    renderPage();

    expect(screen.getByText("15 Agt 2026 – 14 Sep 2026")).toBeInTheDocument();
    expect(screen.getByText("30 hari tersisa")).toBeInTheDocument();
  });

  /** Buying now goes through a checkout page, so the client sees what they get. */
  it("links the catalogue card to the checkout page", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("tab", { name: "Katalog" }));

    expect(screen.getByText("Rp 250.000")).toBeInTheDocument();
    expect(screen.getByText("/ 30 hari")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Berlangganan" })).toHaveAttribute(
      "href",
      "/app/payment-admin/services/1/checkout",
    );
  });

  /** ?tab= drives the page; the page itself never touches the router. */
  it("opens the tab the URL asks for", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MerchantServicesPage tab="invoices" />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("tab", { name: "Riwayat Pembelian" })).toHaveAttribute("data-state", "active");
  });

  it("reports a tab change to its host instead of holding it", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MerchantServicesPage
          tab="subscriptions"
          onTabChange={onTabChange}
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("tab", { name: "Katalog" }));

    expect(onTabChange).toHaveBeenCalledWith("catalog");
  });

  /** An unpaid bill is settled on its own page, where the QR or VA lives. */
  it("sends an unpaid purchase row to its payment page", async () => {
    const user = userEvent.setup();
    vi.spyOn(hooks, "useMerchantServiceInvoices").mockReturnValue({
      data: list([invoice]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoices>);

    renderPage();
    await user.click(screen.getByRole("tab", { name: "Riwayat Pembelian" }));

    expect(screen.getByRole("link", { name: "Bayar" })).toHaveAttribute(
      "href",
      "/app/payment-admin/service-invoices/9",
    );
  });

  it("labels a settled purchase row Detail instead", async () => {
    const user = userEvent.setup();
    vi.spyOn(hooks, "useMerchantServiceInvoices").mockReturnValue({
      data: list([{ ...invoice, status: "PAID" }]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoices>);

    renderPage();
    await user.click(screen.getByRole("tab", { name: "Riwayat Pembelian" }));

    expect(screen.getByRole("link", { name: "Detail" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Bayar" })).not.toBeInTheDocument();
  });
});

/** A plan line nobody has paid for yet — the row the subscription cards cannot show. */
const planLine = {
  service_code: "uxiotopup",
  service_name: "Uxiotopup",
  billing_mode: "billed" as const,
  amount: 250000,
  duration_days: 30,
  governs_licence: true,
  is_active: true,
  active_until: null,
  lifetime: false,
  next_period_starts_at: null,
  next_due_at: null,
  outstanding_total: 250000,
  outstanding: [],
};

const renderTabs = (onTabChange: (tab: string) => void) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServicesPage tab="subscriptions" onTabChange={onTabChange} />
    </QueryClientProvider>,
  );

const mockPlan = (lines: unknown[]) =>
  vi.spyOn(hooks, "useServicePlan").mockReturnValue({
    data: lines,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServicePlan>);

/**
 * A licence bought outright reads as PAID, not as "never paid".
 *
 * `active_until` is null for a lifetime row — the very null that otherwise means
 * "never subscribed" — so the flag beside it is what stops a client who has paid
 * in full being told, on their own panel, that they have paid nothing. That is
 * the one screen that should be confirming the payment landed.
 */
describe("MerchantServicesPage — a lifetime licence is not an unpaid one", () => {
  it("says Seumur hidup instead of Belum pernah dibayar", () => {
    mockPlan([{ ...planLine, lifetime: true, outstanding_total: 0 }]);

    renderPage();

    expect(screen.getByText("Seumur hidup")).toBeInTheDocument();
    expect(screen.queryByText("Belum pernah dibayar")).not.toBeInTheDocument();
  });
});

describe("MerchantServicesPage — an amount owed is a way in, not a restatement", () => {
  it("sends the outstanding amount to the tab that pays it", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    mockPlan([planLine]);
    renderTabs(onTabChange);

    await user.click(screen.getByRole("button", { name: "Belum dibayar Rp 250.000" }));

    expect(onTabChange).toHaveBeenCalledWith("bills");
  });

  /**
   * "Nothing active" and "you owe money" can both be true, and the old copy
   * said only the first — sending a client with a bill off to browse instead.
   */
  it("points a client with a debt at the bill, not at the catalogue", () => {
    vi.spyOn(hooks, "useMerchantSubscriptions").mockReturnValue({
      data: list([]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantSubscriptions>);
    mockPlan([planLine]);
    renderTabs(vi.fn());

    expect(screen.getByText("Ada tagihan yang menunggu dibayar — buka tab Tagihan.")).toBeInTheDocument();
    expect(screen.queryByText("Lihat tab Katalog untuk berlangganan.")).not.toBeInTheDocument();
  });

  it("points a client with nothing at all at the catalogue", () => {
    vi.spyOn(hooks, "useMerchantSubscriptions").mockReturnValue({
      data: list([]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantSubscriptions>);
    mockPlan([]);
    renderTabs(vi.fn());

    expect(screen.getByText("Lihat tab Katalog untuk berlangganan.")).toBeInTheDocument();
    expect(screen.queryByText(/Ada tagihan yang menunggu dibayar/)).not.toBeInTheDocument();
  });
});
