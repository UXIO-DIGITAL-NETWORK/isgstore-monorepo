import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { TransactionSummaryPills } from "./TransactionSummaryPills";

const counts = { count_success: 12, count_pending: 3, count_failed: 1 };

describe("TransactionSummaryPills", () => {
  it("renders each bucket count", () => {
    render(<TransactionSummaryPills counts={counts} active="" onToggle={() => {}} />);

    expect(screen.getByRole("button", { name: /Sukses/i })).toHaveTextContent("12");
    expect(screen.getByRole("button", { name: /Pending/i })).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /Gagal/i })).toHaveTextContent("1");
  });

  it("shows a placeholder while counts are loading", () => {
    render(<TransactionSummaryPills active="" onToggle={() => {}} isLoading />);

    expect(screen.getByRole("button", { name: /Sukses/i })).toHaveTextContent("–");
  });

  it("toggles a bucket on, then off when it is already active", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <TransactionSummaryPills counts={counts} active="" onToggle={onToggle} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Gagal/i }));
    expect(onToggle).toHaveBeenLastCalledWith("failed");

    rerender(<TransactionSummaryPills counts={counts} active="failed" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /Gagal/i }));
    expect(onToggle).toHaveBeenLastCalledWith("");
  });
});
