import { describe, it, expect, vi, beforeEach } from "vitest";

import { api } from "@/lib/axios";
import { envelope } from "@/test/apiEnvelope";
import { CHANNELS } from "../data/channels.data";
import { integrationService } from "../services/integration.service";

vi.mock("@/lib/axios", () => ({ api: { get: vi.fn() } }));

beforeEach(() => vi.clearAllMocks());

describe("integrationService.getChannels", () => {
  it("calls the versioned endpoint and maps the API rows onto the view type", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([
        {
          id: "uxiotopup",
          type: "supplier",
          name: "Uxiotopup",
          connection_status: "connected",
          balance: 6324067,
          last_ping_at: "2026-07-10T08:12:00.000Z",
        },
      ]),
    );

    const result = await integrationService.getChannels();

    expect(api.get).toHaveBeenCalledWith("/v1/integration/channels");
    expect(result[0]).toMatchObject({
      id: "uxiotopup",
      type: "supplier",
      name: "Uxiotopup",
      connection_status: "connected",
      balance: 6324067,
    });
  });

  /**
   * The API reports only channels it can actually probe, so a disconnected
   * provider comes back with a null balance. `undefined` is what the card
   * checks for when deciding whether to show a figure at all.
   */
  it("drops a null balance to undefined so the card can omit the amount", async () => {
    vi.mocked(api.get).mockResolvedValue(
      envelope([
        {
          id: "monetapay",
          type: "payment_gateway",
          name: "Monetapay",
          connection_status: "disconnected",
          balance: null,
          last_ping_at: "2026-07-10T08:12:00.000Z",
        },
      ]),
    );

    const result = await integrationService.getChannels();

    expect(result[0].balance).toBeUndefined();
  });
});

/**
 * The fixtures still back the page tests, and the stat-card captions are
 * derived from these counts — so the breakdown stays asserted even though the
 * service no longer returns them directly.
 */
describe("channel fixtures", () => {
  it("has 6 channels broken down 3 supplier / 2 payment_gateway / 1 whatsapp_gateway", () => {
    expect(CHANNELS).toHaveLength(6);

    const countByType = (type: string) => CHANNELS.filter((channel) => channel.type === type).length;
    expect(countByType("supplier")).toBe(3);
    expect(countByType("payment_gateway")).toBe(2);
    expect(countByType("whatsapp_gateway")).toBe(1);
    expect(countByType("email_gateway")).toBe(0);
  });

  it("has 5 connected and 1 disconnected channel", () => {
    const connected = CHANNELS.filter((channel) => channel.connection_status === "connected").length;
    const disconnected = CHANNELS.filter((channel) => channel.connection_status === "disconnected").length;
    expect(connected).toBe(5);
    expect(disconnected).toBe(1);
  });
});
