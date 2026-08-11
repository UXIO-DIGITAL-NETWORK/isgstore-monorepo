import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope } from "@/test/apiEnvelope";
import { integrationService } from "../services/integration.service";

vi.mock("@/lib/axios", () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

const details = {
  id: "monetapay",
  provider: "monetapay",
  name: "Monetapay",
  type: "payment_gateway",
  connection_status: "connected",
  balance: 1500000,
  mode: "sandbox",
  endpoint: "https://sandbox-api.monetapay.net",
  last_ping_at: "2026-08-11T00:00:00.000Z",
  fields: [
    { key: "collection_app_id", label: "Collection App ID", type: "text", secret: false, value: "APP-1" },
    { key: "token", label: "Token", type: "password", secret: true, value: "••••9876" },
    { key: "is_production", label: "Production Mode", type: "boolean", secret: false, value: false },
  ],
};

describe("integrationService (manage)", () => {
  it("getChannelDetails hits the provider endpoint", async () => {
    vi.mocked(api.get).mockResolvedValue(envelope(details));

    const result = await integrationService.getChannelDetails("monetapay");

    expect(api.get).toHaveBeenCalledWith("/v1/integration/channels/monetapay");
    expect(result.fields).toHaveLength(3);
  });

  it("updateChannel PUTs the payload", async () => {
    vi.mocked(api.put).mockResolvedValue(envelope(details));

    await integrationService.updateChannel("monetapay", { token: "NEW", is_production: true });

    expect(api.put).toHaveBeenCalledWith("/v1/integration/channels/monetapay", {
      token: "NEW",
      is_production: true,
    });
  });

  it("pingChannel POSTs and maps the row (provider defaults to id)", async () => {
    vi.mocked(api.post).mockResolvedValue(
      envelope({
        id: "monetapay",
        type: "payment_gateway",
        name: "Monetapay",
        connection_status: "connected",
        balance: 1500000,
        last_ping_at: "2026-08-11T00:00:00.000Z",
      }),
    );

    const result = await integrationService.pingChannel("monetapay");

    expect(api.post).toHaveBeenCalledWith("/v1/integration/channels/monetapay/ping");
    expect(result.provider).toBe("monetapay");
    expect(result.balance).toBe(1500000);
  });
});
