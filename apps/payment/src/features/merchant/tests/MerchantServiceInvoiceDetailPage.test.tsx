import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";

import MerchantServiceInvoiceDetailPage from "../pages/MerchantServiceInvoiceDetailPage";
import * as hooks from "../hooks/useMerchant";
import type { ServiceInvoice } from "@/types/service.type";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

// Stubbed so the redirect can be fired without driving a file picker.
let lastOnUploaded: (() => void) | undefined;
vi.mock("../components/UploadProofDialog", () => ({
  UploadProofDialog: ({ onUploaded }: { onUploaded?: () => void }) => {
    lastOnUploaded = onUploaded;
    return <button type="button">Unggah Bukti</button>;
  },
}));

const invoice = (over: Partial<ServiceInvoice> = {}): ServiceInvoice =>
  ({
    id: 9,
    invoice_number: "SINV-202608-A1B2C3",
    service: { id: 1, code: "digiflazz", name: "Digiflazz" },
    service_name: "Digiflazz",
    amount: 250000,
    duration_days: 30,
    status: "UNPAID",
    due_at: "2026-08-17T00:00:00+07:00",
    notes: null,
    proof_url: null,
    proof_uploaded_at: null,
    verified_at: null,
    created_at: "2026-08-14T00:00:00+07:00",
    transfer_instruction: {
      bank_name: "BCA",
      account_number: "1234567890",
      account_holder: "UXIO Digital Network",
      note: "Transfer tepat sebesar nominal invoice, lalu unggah bukti transfer.",
    },
    ...over,
  }) as ServiceInvoice;

beforeEach(() => {
  vi.clearAllMocks();
  lastOnUploaded = undefined;

  vi.spyOn(hooks, "useMerchantInstallation").mockReturnValue({
    data: null,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantInstallation>);
  vi.spyOn(hooks, "useRevealDetail").mockReturnValue({ mutateAsync: vi.fn() } as never);
});

const renderPage = (data: ServiceInvoice) => {
  vi.spyOn(hooks, "useMerchantServiceInvoice").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantServiceInvoice>);

  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantServiceInvoiceDetailPage invoiceId={9} />
    </QueryClientProvider>,
  );
};

describe("MerchantServiceInvoiceDetailPage", () => {
  it("shows the transfer instructions while the invoice is unpaid", () => {
    renderPage(invoice());

    expect(screen.getByText("BCA")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  /** Nothing more to do here until kita confirms. */
  it("sends the client to Riwayat Pembelian after a successful upload", () => {
    renderPage(invoice());

    act(() => lastOnUploaded?.());

    expect(navigate).toHaveBeenCalledWith({
      to: "/app/payment-admin/services",
      search: { tab: "invoices" },
    });
  });

  it("drops the instructions once the invoice is paid", () => {
    renderPage(invoice({ status: "PAID" }));

    expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
  });
});
