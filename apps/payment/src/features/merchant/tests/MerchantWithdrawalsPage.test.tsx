import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import MerchantWithdrawalsPage from "../pages/MerchantWithdrawalsPage";
import * as hooks from "../hooks/useMerchant";
import { mockPayoutBanks } from "@/test/payoutBanks";

const mockList = (rows: unknown[] = []) =>
  vi.spyOn(hooks, "useMerchantWithdrawals").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useMerchantWithdrawals>);

const mockCreate = (mutate = vi.fn()) =>
  vi.spyOn(hooks, "useCreateWithdrawal").mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useCreateWithdrawal>);

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MerchantWithdrawalsPage />
    </QueryClientProvider>,
  );

/** Type a query into the searchable bank picker and click the exact option. */
const selectBank = (query: string, exactLabel: string) => {
  const input = screen.getByLabelText("Bank / E-wallet");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  fireEvent.click(screen.getByRole("button", { name: exactLabel }));
};

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
  mockCreate();
  // The bank catalogue is served by the API now, not bundled — the picker has
  // nothing to offer until this resolves.
  mockPayoutBanks();
});

describe("MerchantWithdrawalsPage", () => {
  it("filters the bank catalogue as you type", () => {
    renderPage();

    const input = screen.getByLabelText("Bank / E-wallet");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "neo commerce" } });

    expect(screen.getByRole("button", { name: "BNC — Bank Neo Commerce" })).toBeInTheDocument();
    // An unrelated bank is filtered out.
    expect(screen.queryByRole("button", { name: "BCA — Bank Central Asia (BCA)" })).not.toBeInTheDocument();
  });

  it("previews the flat 1.665 fee and the nett as the amount changes", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "100000" } });

    // fee = 1500 + round(1500 * 0.11) = 1665 (flat); nett = 100000 - 1665 = 98335.
    expect(screen.getByText("Rp 1.665")).toBeInTheDocument();
    expect(screen.getByText("Rp 98.335")).toBeInTheDocument();
  });

  it("submits the picked bank code and beneficiary phone", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    selectBank("central asia", "BCA — Bank Central Asia (BCA)");
    fireEvent.change(screen.getByLabelText("No. Rekening"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Toko Jaya" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "081234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ bank_code: "BCA", account_phone: "081234567890" }),
        expect.anything(),
      ),
    );
  });

  it("hides the account number field when an e-wallet is picked", () => {
    renderPage();

    expect(screen.getByLabelText("No. Rekening")).toBeInTheDocument();
    selectBank("gopay", "GOPAY — GoPay");
    expect(screen.queryByLabelText("No. Rekening")).not.toBeInTheDocument();
  });

  it("submits an e-wallet payout on the phone alone, without the form's rail flag", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    selectBank("gopay", "GOPAY — GoPay");
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Toko Jaya" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "081234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan" }));

    await waitFor(() => expect(create).toHaveBeenCalled());

    const payload = create.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({ bank_code: "GOPAY", account_phone: "081234567890" });
    // `is_ewallet` exists so the schema can branch; it is form state, not a
    // field the API knows, and must not ride along in the request.
    expect(payload).not.toHaveProperty("is_ewallet");
  });

  it("rejects a request with a malformed phone", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    selectBank("central asia", "BCA — Bank Central Asia (BCA)");
    fireEvent.change(screen.getByLabelText("No. Rekening"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Toko Jaya" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan" }));

    expect(await screen.findByText("No. HP penerima tidak valid")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
