import { describe, it, expect } from "vitest";
import { integrationService } from "../services/integration.service";
import { CHANNELS } from "../data/channels.data";

/**
 * Part 5 — contract tests (see product_requirements.md §4.4/§6):
 *
 * - The service resolves exactly the typed channel fixtures.
 * - Fixtures total 7 channels, broken down 4 supplier / 2 payment_gateway /
 *   1 whatsapp_gateway / 0 email_gateway (per the "4 Supplier, 2 Payment,
 *   1 WhatsApp" stat-card caption) — Email Gateway stays a valid category
 *   with zero channels, it isn't omitted from the fixture set's type space.
 * - 5 connected / 2 disconnected (per the "Active" / "Disconnected" cards).
 * - Every channel satisfies the required IntegrationChannel fields.
 */
describe("integrationService", () => {
  it("getChannels resolves the channel fixtures", async () => {
    await expect(integrationService.getChannels()).resolves.toEqual(CHANNELS);
  });

  it("has 7 channels broken down 4 supplier / 2 payment_gateway / 1 whatsapp_gateway", () => {
    expect(CHANNELS).toHaveLength(7);

    const countByType = (type: string) => CHANNELS.filter((channel) => channel.type === type).length;
    expect(countByType("supplier")).toBe(4);
    expect(countByType("payment_gateway")).toBe(2);
    expect(countByType("whatsapp_gateway")).toBe(1);
    expect(countByType("email_gateway")).toBe(0);
  });

  it("has 5 connected and 2 disconnected channels", () => {
    const connected = CHANNELS.filter((channel) => channel.connection_status === "connected").length;
    const disconnected = CHANNELS.filter((channel) => channel.connection_status === "disconnected").length;
    expect(connected).toBe(5);
    expect(disconnected).toBe(2);
  });

  it("every channel has the required IntegrationChannel fields", () => {
    for (const channel of CHANNELS) {
      expect(channel.id).toBeTruthy();
      expect(channel.type).toBeTruthy();
      expect(channel.name).toBeTruthy();
      expect(channel.connection_status).toBeTruthy();
      expect(channel.created_at).toBeTruthy();
      expect(channel.updated_at).toBeTruthy();
    }
  });
});
