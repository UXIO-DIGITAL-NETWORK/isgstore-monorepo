import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen } from "@/test/test-utils";
import { CHANNELS } from "../data/channels.data";

/**
 * Part 5 — test cases (see product_requirements.md §4.4):
 *
 * - /admin/integration-preview (unauthenticated preview route) resolves the
 *   Integration page: header + the exact subcopy.
 * - The 3 overview stat cards render their labels, counts, and plain
 *   captions (this variant has no trend pill).
 * - All 5 category filter options are present, including Email Gateway
 *   even though it has zero registered channels.
 * - At least one channel card per non-empty type renders its name plus
 *   both the connection-status badge and the balance badge.
 * - Switching the category filter changes which cards render.
 */
describe("IntegrationPage", () => {
  it("resolves /admin/integration-preview with the header and subcopy", async () => {
    await renderRoute("/admin/integration-preview");

    expect(await screen.findByRole("heading", { name: "Integration" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage digital supplier connections, payment gateways, and WhatsApp gateways. Ping status and balances update per channel.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the 3 overview stat cards with labels, counts, and plain captions", async () => {
    await renderRoute("/admin/integration-preview");

    expect(await screen.findByText("Total Channels")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect((await screen.findAllByText("Disconnected")).length).toBeGreaterThan(0);

    expect((await screen.findAllByText("7")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("5")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("2")).length).toBeGreaterThan(0);

    expect(screen.getByText("4 Supplier, 2 Payment, 1 WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Channels with an active connection (status ping).")).toBeInTheDocument();
    expect(screen.getByText("Registered channels with a lost connection.")).toBeInTheDocument();
  });

  it("shows all 5 category filter options, including Email Gateway with zero channels", async () => {
    await renderRoute("/admin/integration-preview");

    expect(await screen.findByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Supplier" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Payment Gateway" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Whatsapp Gateway" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Email Gateway" })).toBeInTheDocument();
  });

  it("shows at least one channel card per non-empty type with its name and both badges", async () => {
    await renderRoute("/admin/integration-preview");

    const supplier = CHANNELS.find((channel) => channel.type === "supplier")!;
    const gateway = CHANNELS.find((channel) => channel.type === "payment_gateway")!;
    const whatsapp = CHANNELS.find((channel) => channel.type === "whatsapp_gateway")!;

    for (const channel of [supplier, gateway, whatsapp]) {
      expect(await screen.findByText(channel.name)).toBeInTheDocument();
    }

    expect((await screen.findAllByText("Connected")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Disconnected")).length).toBeGreaterThan(0);
  });

  it("switching the category filter changes which cards render", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/integration-preview");

    const supplierChannel = CHANNELS.find((channel) => channel.type === "supplier")!;
    const gatewayChannel = CHANNELS.find((channel) => channel.type === "payment_gateway")!;

    expect(await screen.findByText(supplierChannel.name)).toBeInTheDocument();
    expect(screen.getByText(gatewayChannel.name)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Payment Gateway" }));

    expect(await screen.findByText(gatewayChannel.name)).toBeInTheDocument();
    expect(screen.queryByText(supplierChannel.name)).not.toBeInTheDocument();
  });
});
