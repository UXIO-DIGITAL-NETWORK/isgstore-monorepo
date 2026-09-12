import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, makeUser, waitFor } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { notificationsService } from "@/lib/notifications.service";
import type { AdminNotification } from "@/types/notification.type";

/**
 * The full feed — what the bell's dropdown is a preview of.
 *
 * Read state is per recipient: the table holds one row per person, so nothing
 * done here can clear somebody else's badge.
 */
const row = (over: Partial<AdminNotification> = {}): AdminNotification => ({
  id: 1,
  type: "refund.claimed",
  title: "Klaim pengembalian dana baru",
  message: "Menunggu verifikasi.",
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

describe("notifications page", () => {
  it("renders the feed", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(1);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);

    await renderRoute("/admin/notifications");

    expect(await screen.findByRole("heading", { name: /notifications/i })).toBeInTheDocument();
    expect(await screen.findByText("Klaim pengembalian dana baru")).toBeInTheDocument();
  });

  it("explains an empty feed instead of showing a bare panel", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(0);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([]) as never);

    await renderRoute("/admin/notifications");

    expect(await screen.findByText(/notifications appear here/i)).toBeInTheDocument();
  });

  it("narrows to the badge set on request", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(1);
    const list = vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);

    const user = userEvent.setup();
    await renderRoute("/admin/notifications");

    await screen.findByText("Klaim pengembalian dana baru");
    await user.click(screen.getByRole("button", { name: /unread only/i }));

    // The filter is a server-side narrowing, not a client-side hide: the page
    // is paginated, so filtering in the browser would only filter one page.
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ filter: "unread" })),
    );
  });

  it("marks a single row read", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(1);
    vi.spyOn(notificationsService, "list").mockResolvedValue(page([row()]) as never);
    const markRead = vi.spyOn(notificationsService, "markRead").mockResolvedValue(undefined);

    const user = userEvent.setup();
    await renderRoute("/admin/notifications");

    await user.click(await screen.findByRole("button", { name: /mark read/i }));

    await waitFor(() => expect(markRead).toHaveBeenCalledWith(1));
  });

  it("offers no per-row action on something already read", async () => {
    vi.spyOn(notificationsService, "unreadCount").mockResolvedValue(0);
    vi.spyOn(notificationsService, "list").mockResolvedValue(
      page([row({ isRead: true, readAt: new Date().toISOString() })]) as never,
    );

    await renderRoute("/admin/notifications");

    await screen.findByText("Klaim pengembalian dana baru");
    expect(screen.queryByRole("button", { name: /mark read/i })).not.toBeInTheDocument();
  });
});
