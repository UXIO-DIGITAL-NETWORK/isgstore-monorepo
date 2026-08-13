import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FinanceInvoicesPage from "../pages/FinanceInvoicesPage";
import * as hooks from "../hooks/useFinance";
import type { ServiceInvoice } from "@/types/service.type";

const invoice = (over: Partial<ServiceInvoice> = {}): ServiceInvoice =>
  ({
    id: 9,
    invoice_number: "SINV-202608-A1B2C3",
    merchant: { id: 7, name: "Toko A", email: "a@x.com" },
    service: { id: 1, code: "digiflazz", name: "Digiflazz" },
    service_name: "Digiflazz",
    amount: 250000,
    duration_days: 30,
    status: "WAITING_CONFIRMATION",
    due_at: "2026-08-17T00:00:00+07:00",
    notes: null,
    proof_url: "https://example.test/storage/bukti.jpg",
    proof_uploaded_at: "2026-08-15T00:00:00+07:00",
    verified_at: null,
    created_at: "2026-08-14T00:00:00+07:00",
    ...over,
  }) as ServiceInvoice;

const confirm = vi.fn();
const reject = vi.fn();

const mockRows = (rows: ServiceInvoice[]) =>
  vi.spyOn(hooks, "useServiceInvoices").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useServiceInvoices>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useConfirmServiceInvoice").mockReturnValue({
    mutate: confirm,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useConfirmServiceInvoice>);
  vi.spyOn(hooks, "useRejectServiceInvoice").mockReturnValue({
    mutate: reject,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useRejectServiceInvoice>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceInvoicesPage />
    </QueryClientProvider>,
  );

describe("FinanceInvoicesPage", () => {
  it("lists an invoice awaiting confirmation", () => {
    mockRows([invoice()]);
    renderPage();

    expect(screen.getByText("SINV-202608-A1B2C3")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByText("Rp 250.000")).toBeInTheDocument();
  });

  /** A settled invoice is history — offering "Periksa" would imply otherwise. */
  it("only offers the review action while a proof is pending", () => {
    mockRows([invoice({ status: "PAID" })]);
    renderPage();

    expect(screen.queryByRole("button", { name: "Periksa" })).not.toBeInTheDocument();
  });

  it("confirms the invoice from the review dialog", async () => {
    const user = userEvent.setup();
    mockRows([invoice()]);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Periksa" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));

    expect(confirm).toHaveBeenCalledWith(9, expect.anything());
  });

  it("rejects with the typed reason", async () => {
    const user = userEvent.setup();
    mockRows([invoice()]);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Periksa" }));
    await user.type(screen.getByLabelText("Alasan penolakan"), "Nominal tidak sesuai");
    await user.click(screen.getByRole("button", { name: "Tolak" }));

    expect(reject).toHaveBeenCalledWith({ id: 9, reason: "Nominal tidak sesuai" }, expect.anything());
  });
});
