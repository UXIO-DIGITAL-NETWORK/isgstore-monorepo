import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import FinanceInvoicesPage from "../pages/FinanceInvoicesPage";
import * as hooks from "../hooks/useFinance";
import type { ServiceInvoice } from "@/types/service.type";

// Every row now carries an internal router link; stub it to a plain anchor so
// this stays a unit test of the list, not of routing.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const invoice = (over: Partial<ServiceInvoice> = {}): ServiceInvoice =>
  ({
    id: 9,
    invoice_number: "SINV-202608-A1B2C3",
    merchant: { id: 7, name: "Toko A", email: "a@x.com" },
    service: { id: 1, code: "uxiotopup", name: "Uxiotopup" },
    service_name: "Uxiotopup",
    amount: 250000,
    duration_days: 30,
    status: "UNPAID",
    due_at: "2026-08-17T00:00:00+07:00",
    notes: null,
    payment: {
      channel: "QRIS",
      channel_code: "qris",
      type: "qris",
      amount: 250000,
      admin_fee: 0,
      total: 250000,
      status: "PENDING",
      expires_at: null,
      is_expired: false,
      instructions: { order_no: "MP-1", qr_string: "000201-QR" },
    },
    verified_at: null,
    created_at: "2026-08-14T00:00:00+07:00",
    ...over,
  }) as ServiceInvoice;

const mockRows = (rows: ServiceInvoice[]) =>
  vi.spyOn(hooks, "useServiceInvoices").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServiceInvoices>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceInvoicesPage />
    </QueryClientProvider>,
  );

beforeEach(() => vi.clearAllMocks());

describe("FinanceInvoicesPage", () => {
  it("lists an invoice awaiting confirmation", () => {
    mockRows([invoice()]);
    renderPage();

    expect(screen.getByText("SINV-202608-A1B2C3")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByText("Rp 250.000")).toBeInTheDocument();
  });

  /**
   * Preparation, confirmation and rejection all live on the detail page now, so
   * even a settled invoice is worth opening — the old em-dash was a dead end.
   */
  it("links every row to its detail page, whatever the status", () => {
    mockRows([invoice(), invoice({ id: 12, invoice_number: "SINV-202608-PAID11", status: "PAID" })]);
    renderPage();

    const links = screen.getAllByRole("link", { name: "Detail" });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/app/payment-internal/invoices/9");
    expect(links[1]).toHaveAttribute("href", "/app/payment-internal/invoices/12");
  });
});
