import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EditConnectionDialog } from "../components/EditConnectionDialog";
import * as hooks from "../hooks/useIntegration";
import type { IntegrationChannelDetails } from "../types/integration.type";

const details: IntegrationChannelDetails = {
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

const mutate = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(hooks, "useChannelDetails").mockReturnValue({
    data: details,
  } as unknown as ReturnType<typeof hooks.useChannelDetails>);
  vi.spyOn(hooks, "useUpdateChannel").mockReturnValue({
    mutate,
    isPending: false,
  } as unknown as ReturnType<typeof hooks.useUpdateChannel>);
});

const renderDialog = () =>
  render(
    <EditConnectionDialog
      provider="monetapay"
      channelName="Monetapay"
      open
      onOpenChange={() => {}}
    />,
  );

describe("EditConnectionDialog", () => {
  it("prefills non-secret fields and leaves the secret blank", () => {
    renderDialog();
    expect(screen.getByLabelText("Collection App ID")).toHaveValue("APP-1");
    expect(screen.getByLabelText("Token")).toHaveValue("");
  });

  it("omits a blank secret on submit (write-only)", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    const payload = mutate.mock.calls[0][0].payload;
    expect(payload).toMatchObject({ collection_app_id: "APP-1", is_production: false });
    expect(payload).not.toHaveProperty("token");
  });

  it("includes the secret when a new value is typed", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Token"), "NEWTOKEN");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(mutate).toHaveBeenCalled());
    expect(mutate.mock.calls[0][0].payload).toMatchObject({ token: "NEWTOKEN" });
  });
});
