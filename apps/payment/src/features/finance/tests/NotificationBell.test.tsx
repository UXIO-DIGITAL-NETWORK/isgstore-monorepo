import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createMemoryHistory, createRootRoute, createRouter } from "@tanstack/react-router";

import { NotificationBell } from "../components/NotificationBell";
import * as hooks from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

const markAll = vi.fn();

const notifications: FinanceNotification[] = [
  {
    id: 1,
    type: "transaction_sale",
    title: "Transaksi masuk",
    message: "Transaksi masuk dari Toko A — INV-1 Rp 60.000",
    data: null,
    is_read: false,
    read_at: null,
    created_at: "2026-08-20T00:00:00.000000Z",
  },
  {
    id: 2,
    type: "withdrawal_request",
    title: "Permintaan penarikan",
    message: "Toko B mengajukan penarikan WD-abc Rp 50.000",
    data: null,
    is_read: true,
    read_at: "2026-08-20T01:00:00.000000Z",
    created_at: "2026-08-20T00:30:00.000000Z",
  },
];

const mockUnread = (count: number) =>
  vi.spyOn(hooks, "useNotificationUnreadCount").mockReturnValue({
    data: count,
  } as unknown as ReturnType<typeof hooks.useNotificationUnreadCount>);

beforeEach(() => {
  vi.clearAllMocks();
  mockUnread(3);
  vi.spyOn(hooks, "useNotifications").mockReturnValue({
    data: { rows: notifications, page: 1, lastPage: 1, total: 2, perPage: 6 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useNotifications>);
  vi.spyOn(hooks, "useMarkAllNotificationsRead").mockReturnValue({
    mutate: markAll,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useMarkAllNotificationsRead>);
});

// The bell's "Lihat semua" is a real SPA Link, so it needs a router context.
// A root-only memory router is enough — no registered route is navigated to.
const renderBell = async () => {
  const rootRoute = createRootRoute({ component: () => <NotificationBell /> });
  const router = createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const utils = render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router as never} />
    </QueryClientProvider>,
  );
  await act(async () => {
    await router.load();
  });
  return utils;
};

describe("NotificationBell", () => {
  it("shows the unread badge with the count", async () => {
    await renderBell();
    expect(screen.getByRole("button", { name: /3 belum dibaca/i })).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge at 99+", async () => {
    mockUnread(120);
    await renderBell();
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("hides the badge when nothing is unread", async () => {
    mockUnread(0);
    await renderBell();
    expect(screen.getByRole("button", { name: "Notifikasi" })).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("lists recent notifications when opened", async () => {
    const user = userEvent.setup();
    await renderBell();

    await user.click(screen.getByRole("button", { name: /belum dibaca/i }));

    expect(await screen.findByText("Transaksi masuk")).toBeInTheDocument();
    expect(screen.getByText("Permintaan penarikan")).toBeInTheDocument();
  });

  it("marks all read from the dropdown action", async () => {
    const user = userEvent.setup();
    await renderBell();

    await user.click(screen.getByRole("button", { name: /belum dibaca/i }));
    await user.click(await screen.findByRole("button", { name: "Tandai semua dibaca" }));

    expect(markAll).toHaveBeenCalled();
  });
});
