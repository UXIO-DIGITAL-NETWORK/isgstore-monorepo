import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, makeUser, waitFor } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { notificationsService } from "@/lib/notifications.service";
import type { AdminNotification } from "@/types/notification.type";

/**
 * The navbar bell.
 *
 * It shipped as a `<Button>` wrapping an icon — no handler, no badge, no
 * request — while the API had been writing rows addressed to role `admin` on
 * every refund claim and exposing the routes to read them only under
 * `v1/payment-internal`. The data was there; the door was not. These cases pin
 * the door open.
 */
const row = (over: Partial<AdminNotification> = {}): AdminNotification => ({
  id: 1,
  type: "refund.claimed",
  title: "Klaim pengembalian dana baru",
  message: "Akun telah diklaim untuk INV-1 sebesar Rp 12.000.",
  data: null,
  isRead: false,
  readAt: null,
  createdAt: new Date().toISOString(),
  ...over,
});

const page = (rows: AdminNotification[]) => ({
  data: rows,
  meta: { current_page: 1, from: 1, last_page: 1, path: "", per_page: 20, to: rows.length, total: rows.length },
  links: { first: null, last: null, prev: null, next: null },
});

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("notification bell", () => {
  it("shows the unread tally on the bell", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(3);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);

    await renderRoute("/admin/dashboard");

    expect(await screen.findByRole("button", { name: /notifications, 3 unread/i })).toBeInTheDocument();
  });

  it("caps a runaway tally instead of breaking the badge out of the button", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(250);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([]) as never);

    await renderRoute("/admin/dashboard");

    expect(await screen.findByText("99+")).toBeInTheDocument();
  });

  it("reads as a plain bell when nothing is unread", async () => {
    // A badge showing "0" is worse than no badge: it draws the eye to nothing.
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(0);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([]) as never);

    await renderRoute("/admin/dashboard");

    expect(await screen.findByRole("button", { name: /^notifications$/i })).toBeInTheDocument();
  });

  it("lists the notifications when opened", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(1);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);

    const user = userEvent.setup();
    await renderRoute("/admin/dashboard");

    await user.click(await screen.findByRole("button", { name: /notifications, 1 unread/i }));

    expect(await screen.findByText("Klaim pengembalian dana baru")).toBeInTheDocument();
  });

  it("clears the badge in one action", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(2);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);
    const markAll = vi.spyOn(notificationsService, "markAllRead").mockResolvedValue(undefined);

    const user = userEvent.setup();
    await renderRoute("/admin/dashboard");

    await user.click(await screen.findByRole("button", { name: /notifications, 2 unread/i }));
    await user.click(await screen.findByRole("button", { name: /mark all read/i }));

    await waitFor(() => expect(markAll).toHaveBeenCalled());
  });

  it("offers no mark-all when there is nothing unread", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(0);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row({ isRead: true })]) as never);

    const user = userEvent.setup();
    await renderRoute("/admin/dashboard");

    await user.click(await screen.findByRole("button", { name: /^notifications$/i }));

    await screen.findByText("Klaim pengembalian dana baru");
    expect(screen.queryByRole("button", { name: /mark all read/i })).not.toBeInTheDocument();
  });

  it("says so when the feed is empty rather than showing a blank panel", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(0);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([]) as never);

    const user = userEvent.setup();
    await renderRoute("/admin/dashboard");

    await user.click(await screen.findByRole("button", { name: /^notifications$/i }));

    expect(await screen.findByText(/no notifications yet/i)).toBeInTheDocument();
  });

  it("stays a usable bell when the count request fails", async () => {
    // The badge is an enhancement; a failed count must not take the navbar with
    // it, and must not read as "you have notifications" either.
    vi.spyOn(notificationsService, "unreadCount").mockRejectedValue(new Error("offline"));
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([]) as never);

    await renderRoute("/admin/dashboard");

    expect(await screen.findByRole("button", { name: /^notifications$/i })).toBeInTheDocument();
  });
});
