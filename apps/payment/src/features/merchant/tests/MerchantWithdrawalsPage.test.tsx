import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import MerchantWithdrawalsPage from "../pages/MerchantWithdrawalsPage";
import * as hooks from "../hooks/useMerchant";
import { BANK_OPTIONS } from "../constants/bankCodes";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockList();
  mockCreate();
});

describe("MerchantWithdrawalsPage", () => {
  it("renders the bank picker as a dropdown of every known bank", () => {
    renderPage();

    const select = screen.getByLabelText("Bank");
    expect(select.tagName).toBe("SELECT");
    // One <option> per bank plus the disabled placeholder.
    expect(screen.getAllByRole("option")).toHaveLength(BANK_OPTIONS.length + 1);
    expect(screen.getByRole("option", { name: /Bank Central Asia/i })).toBeInTheDocument();
  });

  it("previews the flat 1.665 fee and the nett as the amount changes", () => {
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "100000" } });

    // fee = 1500 + round(1500 * 0.11) = 1665 (flat); nett = 100000 - 1665 = 98335.
    expect(screen.getByText("Rp 1.665")).toBeInTheDocument();
    expect(screen.getByText("Rp 98.335")).toBeInTheDocument();
  });

  it("captures the beneficiary phone Monetapay needs and submits it", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("Bank"), { target: { value: "BCA" } });
    fireEvent.change(screen.getByLabelText("No. Rekening"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Toko Jaya" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "081234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ account_phone: "081234567890" }),
        expect.anything(),
      ),
    );
  });

  it("rejects a request with a missing or malformed phone", async () => {
    const create = vi.fn();
    mockCreate(create);
    renderPage();

    fireEvent.change(screen.getByLabelText("Nominal"), { target: { value: "50000" } });
    fireEvent.change(screen.getByLabelText("Bank"), { target: { value: "BCA" } });
    fireEvent.change(screen.getByLabelText("No. Rekening"), { target: { value: "1234567890" } });
    fireEvent.change(screen.getByLabelText("Nama Pemilik"), { target: { value: "Toko Jaya" } });
    fireEvent.change(screen.getByLabelText("No. HP Penerima"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "Ajukan Penarikan" }));

    expect(await screen.findByText("No. HP penerima tidak valid")).toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
