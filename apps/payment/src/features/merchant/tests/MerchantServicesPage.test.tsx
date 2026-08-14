import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import MerchantServicesPage from "../pages/MerchantServicesPage";
import * as hooks from "../hooks/useMerchant";

// The page now renders internal router links; stub them to plain anchors so
// this stays a unit test of the page, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

// Stubbed so the test can fire the upload's completion callback directly rather
// than driving a file picker.
let lastOnUploaded: (() => void) | undefined;
vi.mock("../components/UploadProofDialog", () => ({
  UploadProofDialog: ({ onUploaded }: { onUploaded?: () => void }) => {
    lastOnUploaded = onUploaded;
    return <button type="button">Unggah Bukti</button>;
  },
}));

const list = <T,>(rows: T[]) => ({ rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 });

const service = {
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
};

const invoice = {
  id: 9,
  invoice_number: "SINV-202608-A1B2C3",
  service_name: "Digiflazz",
  amount: 250000,
  duration_days: 30,
  status: "UNPAID",
  due_at: "2026-08-17T00:00:00+07:00",
  notes: null,
  proof_url: null,
  proof_uploaded_at: null,
  verified_at: null,
  created_at: "",
};

const subscription = {
  id: 4,
  service: { id: 1, code: "digiflazz", name: "Digiflazz", category: "supplier" },
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

    expect(screen.getByText("15 Aug 2026 – 14 Sep 2026")).toBeInTheDocument();
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

  it("offers a Detail link on every purchase row", async () => {
    const user = userEvent.setup();
    vi.spyOn(hooks, "useMerchantServiceInvoices").mockReturnValue({
      data: list([invoice]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoices>);

    renderPage();
    await user.click(screen.getByRole("tab", { name: "Riwayat Pembelian" }));

    expect(screen.getByRole("link", { name: "Detail" })).toHaveAttribute(
      "href",
      "/app/payment-admin/service-invoices/9",
    );
  });

  /** After uploading there is nothing more to do until kita confirms. */
  it("brings the purchase history forward after a successful upload", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    vi.spyOn(hooks, "useMerchantServiceInvoices").mockReturnValue({
      data: list([invoice]),
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoices>);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MerchantServicesPage
          tab="invoices"
          onTabChange={onTabChange}
        />
      </QueryClientProvider>,
    );

    // Mounting the tab is what registers the dialog's completion callback.
    await user.click(screen.getByRole("tab", { name: "Riwayat Pembelian" }));
    onTabChange.mockClear();

    act(() => lastOnUploaded?.());

    expect(onTabChange).toHaveBeenCalledWith("invoices");
  });
});
