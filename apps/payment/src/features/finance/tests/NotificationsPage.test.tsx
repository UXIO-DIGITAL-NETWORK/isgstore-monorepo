import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NotificationsPage from "../pages/NotificationsPage";
import * as hooks from "../hooks/useFinance";
import type { FinanceNotification } from "../types/finance.type";

const markRead = vi.fn();
const markAll = vi.fn();

const unread: FinanceNotification = {
  id: 10,
  type: "service_payment",
  title: "Pembayaran layanan",
  message: "Toko A membayar Hosting — SINV-1 Rp 250.000",
  data: null,
  is_read: false,
  read_at: null,
  created_at: "2026-08-20T00:00:00.000000Z",
};

const read: FinanceNotification = {
  ...unread,
  id: 11,
  title: "Paket akan habis",
  message: "Paket Hosting milik Toko B akan habis dalam 3 hari",
  type: "subscription_expiring",
  is_read: true,
  read_at: "2026-08-20T01:00:00.000000Z",
};

const mockRows = (rows: FinanceNotification[]) =>
  vi.spyOn(hooks, "useNotifications").mockReturnValue({
    data: { rows, page: 1, lastPage: 1, total: rows.length, perPage: 20 },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof hooks.useNotifications>);

beforeEach(() => {
  vi.clearAllMocks();
  mockRows([unread, read]);
  vi.spyOn(hooks, "useMarkNotificationRead").mockReturnValue({
    mutate: markRead,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useMarkNotificationRead>);
  vi.spyOn(hooks, "useMarkAllNotificationsRead").mockReturnValue({
    mutate: markAll,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useMarkAllNotificationsRead>);
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <NotificationsPage />
    </QueryClientProvider>,
  );

describe("NotificationsPage", () => {
  it("lists notifications with their messages", () => {
    renderPage();
    expect(screen.getByText("Pembayaran layanan")).toBeInTheDocument();
    expect(screen.getByText("Paket akan habis")).toBeInTheDocument();
  });

  it("marks an unread notification read on click", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Pembayaran layanan"));

    expect(markRead).toHaveBeenCalledWith(10);
  });

  it("does not re-mark an already-read notification", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Paket akan habis"));

    expect(markRead).not.toHaveBeenCalled();
  });

  it("marks all read from the header action", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Tandai semua dibaca" }));

    expect(markAll).toHaveBeenCalled();
  });

  it("shows the empty state when there are no notifications", () => {
    mockRows([]);
    renderPage();

    expect(screen.getByText("Belum ada notifikasi")).toBeInTheDocument();
  });
});
