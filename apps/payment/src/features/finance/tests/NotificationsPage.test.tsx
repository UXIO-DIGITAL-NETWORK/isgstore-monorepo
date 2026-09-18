import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import NotificationsPage from "../pages/NotificationsPage";
import * as hooks from "../hooks/useFinance";
import { useAuthStore } from "@/store/useAuthStore";
import type { FinanceNotification } from "../types/finance.type";

// Rows are internal router links now; stub them as anchors so this stays a unit
// test of the page. onClick is forwarded because opening a row is also what
// marks it read.
vi.mock("@/components/common/Link", () => ({
  Link: ({ href, children, onClick }: { href: string; children: ReactNode; onClick?: () => void }) => (
    <a
      href={href}
      onClick={onClick}
    >
      {children}
    </a>
  ),
}));

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

  /** Opening a notification is the moment it stops being unread. */
  it("marks an unread notification read when it is opened", async () => {
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

  /**
   * A notification about a bill you cannot open from the notification is an
   * announcement. The destination is the reader's own page, never the other
   * role's — the two audiences share this component but not these routes.
   */
  it("sends a client's notification to the client's own page", () => {
    useAuthStore.setState({ user: { id: 1, role: "payment-admin" } as never });
    mockRows([unread]);
    renderPage();

    expect(screen.getByRole("link", { name: /Pembayaran layanan/ })).toHaveAttribute(
      "href",
      "/app/payment-admin/services?tab=invoices",
    );

    useAuthStore.setState({ user: null });
  });
});
