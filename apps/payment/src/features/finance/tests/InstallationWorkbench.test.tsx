import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { InstallationWorkbench } from "../components/InstallationWorkbench";
import * as hooks from "../hooks/useFinance";
import type { InstallationScope, ServiceInstallation } from "@/types/service.type";

const setCompletion = vi.fn();
const deleteStep = vi.fn();
const deleteDetail = vi.fn();

const installation: ServiceInstallation = {
  id: 7,
  starts_at: "2026-08-15T00:00:00+07:00",
  ends_at: "2026-08-20T00:00:00+07:00",
  notes: null,
  steps_total: 2,
  steps_completed: 1,
  progress_percent: 50,
  status: "IN_PROGRESS",
  steps: [
    { id: 21, title: "Verifikasi akun", description: null, sort_order: 1, is_completed: true, completed_at: "2026-08-15T10:20:00+07:00" },
    { id: 22, title: "Uji transaksi", description: null, sort_order: 2, is_completed: false, completed_at: null },
  ],
  details: [
    { id: 5, label: "Username", value: "uxio-prod", masked_value: "uxio-prod", is_secret: false, sort_order: 1 },
    { id: 6, label: "API Key", value: null, masked_value: "••••••••3f9a", is_secret: true, sort_order: 2 },
  ],
};

const mockInstallation = (data: ServiceInstallation | null) =>
  vi.spyOn(hooks, "useFinanceInstallation").mockReturnValue({
    data,
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useFinanceInstallation>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useSetStepCompletion").mockReturnValue({ mutate: setCompletion } as never);
  vi.spyOn(hooks, "useDeleteStep").mockReturnValue({ mutate: deleteStep } as never);
  vi.spyOn(hooks, "useDeleteDetailItem").mockReturnValue({ mutate: deleteDetail } as never);
  vi.spyOn(hooks, "useRevealFinanceDetail").mockReturnValue({ mutateAsync: vi.fn() } as never);
  vi.spyOn(hooks, "useUpsertInstallation").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useCreateStep").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useUpdateStep").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useCreateDetailItem").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
  vi.spyOn(hooks, "useUpdateDetailItem").mockReturnValue({ mutate: vi.fn(), isPending: false } as never);
});

const renderWorkbench = (scope: InstallationScope = { by: "subscription", id: 4 }) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <InstallationWorkbench scope={scope} />
    </QueryClientProvider>,
  );

describe("InstallationWorkbench", () => {
  /** Steps and credentials hang off the installation; there is nothing to add to yet. */
  it("disables adding steps and credentials until an installation exists", () => {
    mockInstallation(null);
    renderWorkbench();

    expect(screen.getByRole("button", { name: "Tambah Tahapan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tambah Detail" })).toBeDisabled();
    expect(screen.getByText("Instalasi belum dijadwalkan")).toBeInTheDocument();
  });

  it("shows the derived progress and the checklist behind it", () => {
    mockInstallation(installation);
    renderWorkbench();

    expect(screen.getByText("1/2 langkah · 50%")).toBeInTheDocument();
    expect(screen.getAllByText("Verifikasi akun").length).toBeGreaterThan(0);
  });

  /** Desired state, not a flip — two open tabs must converge. */
  it("sends the desired state when a step is ticked", async () => {
    const user = userEvent.setup();
    mockInstallation(installation);
    renderWorkbench();

    await user.click(screen.getByRole("checkbox", { name: "Tandai Uji transaksi" }));

    expect(setCompletion).toHaveBeenCalledWith({ id: 22, completed: true });
  });

  it("asks before deleting a credential", async () => {
    const user = userEvent.setup();
    mockInstallation(installation);
    renderWorkbench();

    // Two "Hapus" per row group; the credentials table's are the last two.
    const removals = screen.getAllByRole("button", { name: "Hapus" });
    await user.click(removals[removals.length - 1]);

    expect(screen.getByText(/"API Key" akan dihapus/)).toBeInTheDocument();
    expect(deleteDetail).not.toHaveBeenCalled();
  });

  it("keeps a secret masked in the table", () => {
    mockInstallation(installation);
    renderWorkbench();

    expect(screen.getByText("••••••••3f9a")).toBeInTheDocument();
  });

  /** One row, two access paths — the whole point of the scope prop. */
  it("reaches the installation by whichever id it was given", () => {
    const spy = mockInstallation(installation);

    renderWorkbench({ by: "invoice", id: 9 });
    expect(spy).toHaveBeenCalledWith({ by: "invoice", id: 9 });

    renderWorkbench({ by: "subscription", id: 4 });
    expect(spy).toHaveBeenLastCalledWith({ by: "subscription", id: 4 });
  });
});
