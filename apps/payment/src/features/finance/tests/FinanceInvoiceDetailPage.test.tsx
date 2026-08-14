import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import FinanceInvoiceDetailPage from "../pages/FinanceInvoiceDetailPage";
import * as hooks from "../hooks/useFinance";
import type { ServiceInstallation, ServiceInvoice } from "@/types/service.type";

vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const confirm = vi.fn();
const reject = vi.fn();

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

const prepared: ServiceInstallation = {
  id: 7,
  starts_at: "2026-08-15T00:00:00+07:00",
  ends_at: "2026-08-20T00:00:00+07:00",
  notes: null,
  steps_total: 1,
  steps_completed: 0,
  progress_percent: 0,
  status: "IN_PROGRESS",
  steps: [
    {
      id: 21,
      title: "Verifikasi akun",
      description: null,
      sort_order: 1,
      is_completed: false,
      completed_at: null,
    },
  ],
  details: [],
};

const mockScene = (inv: ServiceInvoice, installation: ServiceInstallation | null) => {
  vi.spyOn(hooks, "useFinanceInvoice").mockReturnValue({
    data: inv,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceInvoice>);

  vi.spyOn(hooks, "useFinanceInstallation").mockReturnValue({
    data: installation,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceInstallation>);
};

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

  // The workbench's own hooks — it renders inside this page.
  vi.spyOn(hooks, "useSetStepCompletion").mockReturnValue({ mutate: vi.fn() } as never);
  vi.spyOn(hooks, "useDeleteStep").mockReturnValue({ mutate: vi.fn() } as never);
  vi.spyOn(hooks, "useDeleteDetailItem").mockReturnValue({ mutate: vi.fn() } as never);
  vi.spyOn(hooks, "useRevealFinanceDetail").mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.spyOn(hooks, "useUpsertInstallation").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useCreateStep").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useUpdateStep").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useCreateDetailItem").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useUpdateDetailItem").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FinanceInvoiceDetailPage invoiceId={9} />
    </QueryClientProvider>,
  );

describe("FinanceInvoiceDetailPage", () => {
  it("shows the invoice, the client and the bukti transfer", () => {
    mockScene(invoice(), prepared);
    renderPage();

    expect(screen.getByText("SINV-202608-A1B2C3")).toBeInTheDocument();
    expect(screen.getByText("Toko A")).toBeInTheDocument();
    expect(screen.getByAltText("Bukti transfer SINV-202608-A1B2C3")).toBeInTheDocument();
  });

  /** Warn, do not block — but say exactly what the client will be left seeing. */
  it("names what is missing before confirming, and does not confirm yet", async () => {
    const user = userEvent.setup();
    mockScene(invoice(), null);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));

    // The same phrase is the workbench's empty state, so scope to the dialog.
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Instalasi belum dijadwalkan/)).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
  });

  it("still confirms after the warning", async () => {
    const user = userEvent.setup();
    mockScene(invoice(), null);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));
    await user.click(screen.getByRole("button", { name: "Konfirmasi Tetap" }));

    expect(confirm).toHaveBeenCalledWith(9, expect.anything());
  });

  it("confirms on the first click once the installation is prepared", async () => {
    const user = userEvent.setup();
    mockScene(invoice(), prepared);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Konfirmasi" }));

    expect(confirm).toHaveBeenCalledWith(9);
    expect(screen.queryByRole("button", { name: "Konfirmasi Tetap" })).not.toBeInTheDocument();
  });

  /** Migrated from the list's dialog test, assertion unchanged. */
  it("rejects with the typed reason", async () => {
    const user = userEvent.setup();
    mockScene(invoice(), prepared);
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tolak" }));

    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText("Alasan penolakan"), "Nominal tidak sesuai");
    await user.click(within(dialog).getByRole("button", { name: "Tolak" }));

    expect(reject).toHaveBeenCalledWith({ id: 9, reason: "Nominal tidak sesuai" }, expect.anything());
  });

  /** Prepared work is invisible to the client until confirmation. */
  it("marks a prepared installation as not yet active for the client", () => {
    mockScene(invoice(), prepared);
    renderPage();

    expect(screen.getByText("Instalasi sudah disiapkan · belum aktif untuk client")).toBeInTheDocument();
  });

  it("hides the actions once the invoice is paid", () => {
    mockScene(invoice({ status: "PAID" }), prepared);
    renderPage();

    expect(screen.queryByRole("button", { name: "Konfirmasi" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tolak" })).not.toBeInTheDocument();
  });
});
