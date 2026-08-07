import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { paginated } from "@/test/apiEnvelope";
import { activityService } from "../services/activity.service";

vi.mock("@/lib/axios", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const apiRow = (over: Record<string, unknown> = {}) => ({
  id: 42,
  user_id: 5,
  transaction_id: null,
  type: "login",
  actor: "John Doe",
  role: "Admin",
  ip_address: "192.168.1.100",
  user_agent: "Mozilla/5.0",
  message: "Signed in",
  created_at: "2026-08-01T10:30:00.000Z",
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("activityService.list", () => {
  it("forwards search and pagination params to the activity-logs endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([]));

    await activityService.list({ search: "login", page: 2, per_page: 20 });

    expect(api.get).toHaveBeenCalledWith("/v1/activity-logs", {
      params: { search: "login", page: 2, per_page: 20 },
    });
  });

  it("maps an API row onto the camelCase view type with a string id", async () => {
    vi.mocked(api.get).mockResolvedValue(paginated([apiRow()]));

    const result = await activityService.list();

    expect(result.data[0]).toEqual({
      id: "42",
      userId: 5,
      transactionId: null,
      type: "login",
      actor: "John Doe",
      role: "Admin",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0",
      message: "Signed in",
      createdAt: "2026-08-01T10:30:00.000Z",
    });
  });

  it("preserves the API's System/null fallbacks for system-generated rows", async () => {
    vi.mocked(api.get).mockResolvedValue(
      paginated([apiRow({ user_id: null, actor: "System", role: null, type: null, ip_address: null })]),
    );

    const [row] = (await activityService.list()).data;

    expect(row).toMatchObject({ actor: "System", role: null, type: null, ipAddress: null });
  });
});
