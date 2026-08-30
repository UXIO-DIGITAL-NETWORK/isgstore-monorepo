import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { BankCombobox } from "./BankCombobox";
import * as payoutBanks from "@/hooks/usePayoutBanks";

const BANKS: payoutBanks.PayoutBank[] = [
  { code: "BCA", name: "Bank Central Asia (BCA)", is_ewallet: false },
  { code: "BNC", name: "Bank Neo Commerce", is_ewallet: false },
  { code: "DANA", name: "DANA", is_ewallet: true },
];

const mockBanks = (banks: payoutBanks.PayoutBank[] = BANKS) =>
  vi.spyOn(payoutBanks, "usePayoutBanks").mockReturnValue({
    data: banks,
  } as unknown as ReturnType<typeof payoutBanks.usePayoutBanks>);

const open = () => {
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  return input;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockBanks();
});

describe("BankCombobox", () => {
  it("lists the catalogue the API served", () => {
    render(<BankCombobox onChange={vi.fn()} />);
    open();

    expect(screen.getByRole("button", { name: "BCA — Bank Central Asia (BCA)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DANA — DANA" })).toBeInTheDocument();
  });

  it("filters by name and by code", () => {
    render(<BankCombobox onChange={vi.fn()} />);
    const input = open();

    fireEvent.change(input, { target: { value: "neo commerce" } });
    expect(screen.getByRole("button", { name: "BNC — Bank Neo Commerce" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "BCA — Bank Central Asia (BCA)" })).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "bca" } });
    expect(screen.getByRole("button", { name: "BCA — Bank Central Asia (BCA)" })).toBeInTheDocument();
  });

  it("reports the picked code and shows its label", () => {
    const onChange = vi.fn();
    const { rerender } = render(<BankCombobox onChange={onChange} />);
    open();

    fireEvent.click(screen.getByRole("button", { name: "DANA — DANA" }));
    expect(onChange).toHaveBeenCalledWith("DANA");

    rerender(
      <BankCombobox
        value="DANA"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("DANA — DANA");
  });

  it("says so when nothing matches", () => {
    render(<BankCombobox onChange={vi.fn()} />);
    fireEvent.change(open(), { target: { value: "zzzz" } });

    expect(screen.getByText("Bank tidak ditemukan")).toBeInTheDocument();
  });

  it("stays usable while the catalogue is still loading", () => {
    // An empty list is what the hook yields before the request resolves; the
    // field must not crash or claim the bank does not exist.
    mockBanks([]);
    render(<BankCombobox onChange={vi.fn()} />);
    open();

    expect(screen.getByText("Memuat daftar bank…")).toBeInTheDocument();
  });
});
