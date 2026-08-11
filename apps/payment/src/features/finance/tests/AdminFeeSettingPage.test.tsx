import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import AdminFeeSettingPage from "../pages/AdminFeeSettingPage";
import * as hooks from "../hooks/useFinance";

const save = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useAdminFee").mockReturnValue({
    data: { type: "fixed", value: 3000 },
  } as unknown as ReturnType<typeof hooks.useAdminFee>);
  vi.spyOn(hooks, "useUpdateAdminFee").mockReturnValue({
    mutate: save,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useUpdateAdminFee>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AdminFeeSettingPage />
    </QueryClientProvider>,
  );

describe("AdminFeeSettingPage", () => {
  it("prefills the current admin fee", () => {
    renderPage();
    expect(screen.getByLabelText(/Nilai/)).toHaveValue(3000);
  });

  it("submits the selected type and value", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /Persen/ }));
    const input = screen.getByLabelText(/Nilai/);
    await user.clear(input);
    await user.type(input, "5");
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(save).toHaveBeenCalledWith({ type: "percent", value: 5 });
  });
});
