import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/axios";
import { envelope, paginated } from "@/test/apiEnvelope";
import { financeService } from "../services/finance.service";
import { useAuthStore } from "@/store/useAuthStore";
import { ROLES } from "@/constants/roles";
import type { User } from "@/models/user.model";

vi.mock("@/lib/axios");

/**
 * Which door each role knocks on.
 *
 * The feed used to be internal-only, so its four calls were hardcoded under
 * `/payment-internal`. A client reading it there gets a 403 — the route group
 * is what decides who may ask — while their own rows sit unread under
 * `/payment-admin`. These pin the prefix per role, because the failure is a
 * 403 the UI renders as an empty feed: indistinguishable from having nothing.
 */
const signIn = (role: string) =>
  useAuthStore.setState({ user: { id: 1, name: "T", email: "t@t.test", role_id: 1, role } as User });

beforeEach(() => vi.clearAllMocks());
afterEach(() => useAuthStore.setState({ user: null }));

describe("notification feed routing", () => {
  it("sends the internal team to the internal group", async () => {
    signIn(ROLES.INTERNAL);
    vi.mocked(api.get).mockResolvedValueOnce(paginated([]) as never);

    await financeService.notifications({});

    expect(api.get).toHaveBeenCalledWith("/v1/payment-internal/notifications", expect.anything());
  });

  it("sends a client to their own group", async () => {
    signIn(ROLES.ADMIN);
    vi.mocked(api.get).mockResolvedValueOnce(paginated([]) as never);

    await financeService.notifications({});

    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/notifications", expect.anything());
  });

  it("routes the badge count the same way", async () => {
    signIn(ROLES.ADMIN);
    vi.mocked(api.get).mockResolvedValueOnce(envelope({ unread_count: 2 }) as never);

    await expect(financeService.notificationsUnreadCount()).resolves.toBe(2);
    expect(api.get).toHaveBeenCalledWith("/v1/payment-admin/notifications/unread-count");
  });

  it("routes both write actions the same way", async () => {
    signIn(ROLES.ADMIN);
    vi.mocked(api.post).mockResolvedValue(envelope(null) as never);

    await financeService.markNotificationRead(7);
    await financeService.markAllNotificationsRead();

    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/notifications/7/read", {});
    expect(api.post).toHaveBeenCalledWith("/v1/payment-admin/notifications/read-all", {});
  });

  it("resolves per call, not once at import", async () => {
    // The module is imported once and the signed-in user can change without a
    // reload — a base captured at module scope would keep pointing at whoever
    // was signed in first.
    signIn(ROLES.INTERNAL);
    vi.mocked(api.get).mockResolvedValue(paginated([]) as never);
    await financeService.notifications({});

    signIn(ROLES.ADMIN);
    await financeService.notifications({});

    expect(api.get).toHaveBeenNthCalledWith(1, "/v1/payment-internal/notifications", expect.anything());
    expect(api.get).toHaveBeenNthCalledWith(2, "/v1/payment-admin/notifications", expect.anything());
  });
});
