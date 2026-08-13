import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import MerchantDashboardPage from "../pages/MerchantDashboardPage";
import * as hooks from "../hooks/useMerchant";

// The card's "Go Check" is an internal router Link; stub it to a plain anchor
// so this stays a unit test of the dashboard, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const dashboard = (over: Record<string, unknown> = {}) => ({
  saldo_aktif: 60000,
  saldo_pending: 0,
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

describe("MerchantDashboardPage — Website Services card", () => {
  it("shows the nearest subscription expiry", () => {
    mockDashboard();
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    expect(screen.getByText("• Active until 1 Sep 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go Check" })).toBeInTheDocument();
  });

  /** An invented "Active until" would be worse than showing nothing. */
  it("omits the date line when nothing is subscribed", () => {
    mockDashboard({ service_active_until: null, active_services_count: 0 });
    renderPage();

    expect(screen.getByText("Website Services")).toBeInTheDocument();
    expect(screen.queryByText(/Active until/)).not.toBeInTheDocument();
  });
});
