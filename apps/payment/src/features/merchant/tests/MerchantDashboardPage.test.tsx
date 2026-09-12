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

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantDashboardPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

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
});

describe("MerchantDashboardPage — Website Services card", () => {
  it("shows the nearest subscription expiry", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    // Indonesian, because this panel's default is: the card used to be
    // hardcoded English on an otherwise Indonesian screen.
    expect(screen.getByText("• Aktif sampai 1 Sep 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lihat" })).toBeInTheDocument();
  });

  /** An invented "Aktif sampai" would be worse than showing nothing. */
  it("omits the date line when nothing is subscribed", () => {
    mockDashboard({ service_active_until: null, active_services_count: 0 });
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    expect(screen.queryByText(/Aktif sampai/)).not.toBeInTheDocument();
  });
});
