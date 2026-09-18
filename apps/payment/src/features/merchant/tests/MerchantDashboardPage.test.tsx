import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import MerchantDashboardPage from "../pages/MerchantDashboardPage";
import * as hooks from "../hooks/useMerchant";

// The card's CTA is an internal router Link; stub it to a plain anchor
// so this stays a unit test of the dashboard, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const dashboard = (over: Record<string, unknown> = {}) => ({
  saldo_aktif: 60000,
  saldo_pending: 0,
  saldo_tertahan: 25000,
  total_penjualan: 60000,
  total_penarikan: 0,
  total_transaksi: 1,
  service_active_until: "2026-09-01T00:00:00+07:00",
  active_services_count: 3,
  ...over,
});

const mockDashboard = (over: Record<string, unknown> = {}) =>
  vi.spyOn(hooks, "useMerchantDashboard").mockReturnValue({
    data: dashboard(over),
  } as unknown as ReturnType<typeof hooks.useMerchantDashboard>);

const sale = (over: Record<string, unknown> = {}) => ({
  type: "sale",
  id: 1,
  invoice_number: "INV-202608-X1",
  title: "10 Diamonds",
  direction: "in",
  amount: 25000,
  status: "SUCCESS",
  payment_status: "SUCCESS",
  provider_status: "DELIVERED",
  payment_channel: "QRIS",
  created_at: "2026-08-14T10:00:00+07:00",
  ...over,
});

const mockRecent = (rows: Record<string, unknown>[] = [sale()]) =>
  vi.spyOn(hooks, "useMerchantTransactions").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 5 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof hooks.useMerchantTransactions>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantDashboardPage />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockRecent();
});

describe("MerchantDashboardPage — saldo cards", () => {
  /**
   * The held-balance card: earned money still inside the per-channel holding
   * period. Without it a freshly-paid sale reads as "missing money".
   */
  it("shows Saldo Tertahan alongside the other balances", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByText("Saldo Tertahan")).toBeInTheDocument();
    expect(screen.getByText("Rp 25.000,00")).toBeInTheDocument();
    expect(screen.getByText("Menunggu settlement channel + masa tahan")).toBeInTheDocument();
  });

  /** A figure the client cannot act on or explain is a dead end. */
  it("sends each balance to the screen that accounts for it", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByRole("link", { name: /Saldo Tertahan/ })).toHaveAttribute(
      "href",
      "/app/payment-admin/transactions",
    );
    expect(screen.getByRole("link", { name: /Saldo Aktif/ })).toHaveAttribute(
      "href",
      "/app/payment-admin/withdrawals",
    );
  });
});

describe("MerchantDashboardPage — honest states", () => {
  /**
   * The property worth locking: a failed read must never render as "Rp 0",
   * which on a money screen is indistinguishable from an empty account.
   */
  it("withholds the figures and offers a retry when the summary fails", () => {
    vi.spyOn(hooks, "useMerchantDashboard").mockReturnValue({
      data: undefined,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof hooks.useMerchantDashboard>);

    renderPage();

    expect(screen.queryByText("Rp 0,00")).not.toBeInTheDocument();
    expect(screen.getByText("Ringkasan saldo gagal dimuat")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeInTheDocument();
  });

  it("shows placeholders rather than zeros while the summary loads", () => {
    vi.spyOn(hooks, "useMerchantDashboard").mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof hooks.useMerchantDashboard>);

    renderPage();

    expect(screen.queryByText("Rp 0,00")).not.toBeInTheDocument();
    expect(screen.queryByText("Saldo Tertahan")).not.toBeInTheDocument();
  });
});

describe("MerchantDashboardPage — recent activity", () => {
  it("shows the latest sales and a way to the full list", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByText("Aktivitas terbaru")).toBeInTheDocument();
    expect(screen.getByText("10 Diamonds")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Lihat semua transaksi" })).toHaveAttribute(
      "href",
      "/app/payment-admin/transactions",
    );
  });

  /** The first screen a brand-new client sees: name the space, offer one step. */
  it("teaches the empty state instead of showing a bare 'no data'", () => {
    mockDashboard({ saldo_aktif: 0, saldo_tertahan: 0, total_penjualan: 0, total_transaksi: 0 });
    mockRecent([]);
    renderPage();

    expect(screen.getByText("Belum ada aktivitas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buka katalog layanan" })).toHaveAttribute(
      "href",
      "/app/payment-admin/services",
    );
  });
});

describe("MerchantDashboardPage — Website Services card", () => {
  it("shows the nearest subscription expiry", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    // Indonesian, because this panel's default is: the card used to be
    // hardcoded English on an otherwise Indonesian screen.
    expect(screen.getByText("• Aktif sampai 1 Sep 2026")).toBeInTheDocument();
    // The label names its destination — a bare "Lihat" left the client guessing.
    expect(screen.getByRole("button", { name: "Buka layanan" })).toBeInTheDocument();
    expect(screen.getByText("3 layanan aktif")).toBeInTheDocument();
  });

  /** An invented "Aktif sampai" would be worse than showing nothing. */
  it("omits the date line when nothing is subscribed", () => {
    mockDashboard({ service_active_until: null, active_services_count: 0 });
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    expect(screen.queryByText(/Aktif sampai/)).not.toBeInTheDocument();
    expect(screen.queryByText(/layanan aktif/)).not.toBeInTheDocument();
  });
});
