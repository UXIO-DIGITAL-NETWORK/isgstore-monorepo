import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OutstandingBillsPanel } from "../components/OutstandingBillsPanel";
import * as hooks from "../hooks/useMerchant";
import type { ServicePlanLine } from "@/types/service.type";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

const pay = vi.fn();

const channel = {
  id: 2,
  name: "QRIS",
  channel_code: "qris",
  payment_type: "qris",
  fee_flat: 2500,
  fee_percent: 1,
  min_amount: 0,
  is_active: true,
};

const line = (over: Partial<ServicePlanLine> = {}): ServicePlanLine => ({
  service_code: "domain",
  service_name: "Domain",
  billing_mode: "billed",
  amount: 100_000,
  duration_days: 365,
  governs_licence: false,
  is_active: true,
  active_until: null,
  lifetime: false,
  next_period_starts_at: null,
  next_due_at: "2026-10-01T00:00:00+07:00",
  outstanding_total: 100_000,
  outstanding: [
    {
      id: 1,
      invoice_number: "SINV-A",
      amount: 100_000,
      due_at: "2026-10-01T00:00:00+07:00",
      period_starts_at: null,
      period_ends_at: null,
    },
  ],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(hooks, "useServicePaymentChannels").mockReturnValue({
    data: [channel],
    isLoading: false,
  } as unknown as ReturnType<typeof hooks.useServicePaymentChannels>);

  vi.spyOn(hooks, "usePayInvoiceBatch").mockReturnValue({
    mutate: pay,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.usePayInvoiceBatch>);
});

describe("OutstandingBillsPanel", () => {
  it("says so when nothing is due", () => {
    render(<OutstandingBillsPanel lines={[line({ outstanding: [], outstanding_total: 0 })]} />);

    expect(screen.getByText(/Tidak ada tagihan/)).toBeInTheDocument();
  });

  /**
   * An empty plan is not the same claim as "everything is settled". The second
   * is reassurance; the first is the symptom of a plan that was never pulled,
   * and it must not be dressed up as the second.
   */
  it("does not claim everything is settled when there is no plan to read", () => {
    render(<OutstandingBillsPanel lines={[]} />);

    expect(screen.getByText("Belum ada tagihan dari paket layananmu.")).toBeInTheDocument();
    expect(screen.queryByText(/Semua layanan sudah lunas/)).not.toBeInTheDocument();
  });

  /**
   * The pay button used to exist only AFTER a selection, so a client who had
   * just been sent a bill could not see how to pay it. It is on screen from the
   * start now, with the one missing step named.
   */
  it("shows how to pay before anything is ticked", async () => {
    const user = userEvent.setup();
    render(<OutstandingBillsPanel lines={[line()]} />);

    expect(
      screen.getByText("Centang tagihan yang mau dibayar, lalu pilih metode pembayaran."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bayar yang dipilih" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));

    // Ticking a bill trades the hint for the actual choice.
    expect(screen.queryByText(/Centang tagihan/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /QRIS/ })).toBeInTheDocument();
  });

  /** A bill you must hit a small box to pay is a bill somebody will not pay. */
  it("toggles a bill from anywhere in its row", async () => {
    const user = userEvent.setup();
    render(<OutstandingBillsPanel lines={[line()]} />);

    await user.click(screen.getByText("Domain"));

    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("groups bills by the day they fall due", () => {
    render(
      <OutstandingBillsPanel
        lines={[
          line(),
          line({
            service_code: "email",
            service_name: "Email",
            outstanding: [
              {
                id: 2,
                invoice_number: "SINV-B",
                amount: 200_000,
                due_at: "2026-11-01T00:00:00+07:00",
                period_starts_at: null,
                period_ends_at: null,
              },
            ],
          }),
        ]}
      />,
    );

    // Two different due dates, two groups — bills that fall due together are
    // what a client pays together.
    expect(screen.getAllByRole("button", { name: "Pilih semua di tanggal ini" })).toHaveLength(2);
  });

  it("charges the admin fee ONCE on the sum, not once per bill", async () => {
    const user = userEvent.setup();

    render(
      <OutstandingBillsPanel
        lines={[
          line(),
          line({
            service_code: "email",
            service_name: "Email",
            outstanding: [
              {
                id: 2,
                invoice_number: "SINV-B",
                amount: 200_000,
                // Same day, so one group.
                due_at: "2026-10-01T00:00:00+07:00",
                period_starts_at: null,
                period_ends_at: null,
              },
            ],
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Pilih semua di tanggal ini" }));
    await user.click(screen.getByRole("button", { name: /QRIS/ }));

    // 2.500 + 1% of 300.000 = 5.500. Two flat fees would be 2.500 more, charged
    // to the client for the convenience of paying once.
    expect(screen.getByText(/Rp\s?5\.500/)).toBeInTheDocument();
    expect(screen.getByText(/Rp\s?305\.500/)).toBeInTheDocument();
  });

  it("sends every ticked bill in one attempt", async () => {
    const user = userEvent.setup();

    render(<OutstandingBillsPanel lines={[line()]} />);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /QRIS/ }));
    await user.click(screen.getByRole("button", { name: "Bayar yang dipilih" }));

    expect(pay).toHaveBeenCalledWith(
      { invoiceIds: [1], channelId: 2 },
      expect.anything(),
    );
  });

  /**
   * A one-time setup fee is paid once and buys no period. Saying so on the bill
   * is what stops the client expecting a renewal — and what explains why this
   * one will not come back next month like the others.
   */
  it("marks a one-time fee as a single payment", () => {
    render(
      <OutstandingBillsPanel
        lines={[
          line({ service_code: "setup", service_name: "Biaya Setup", billing_mode: "one_time" }),
          line({ service_code: "email", service_name: "Email" }),
        ]}
      />,
    );

    // Only the setup line carries the badge — a recurring bill must not.
    expect(screen.getAllByText("Sekali bayar")).toHaveLength(1);
  });
});
