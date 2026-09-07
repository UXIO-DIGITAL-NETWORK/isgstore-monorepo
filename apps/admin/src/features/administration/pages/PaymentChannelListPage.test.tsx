import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { paymentChannelsService } from "../services/administration.service";
import type { PaymentChannel } from "../types/administration.type";

const channel = (overrides: Partial<PaymentChannel> = {}): PaymentChannel => ({
  id: "1",
  payment_type: "virtual_account",
  channel_code: "bca_va",
  name: "BCA Virtual Account",
  min_amount: 10000,
  fee_flat: 4000,
  fee_percent: 0,
  sort_order: 0,
  is_active: true,
  is_single_use: false,
  created_at: "2026-07-31",
  updated_at: "2026-07-31",
  ...overrides,
});

const paginated = (rows: PaymentChannel[]) => ({
  data: rows,
  links: { first: null, last: null, prev: null, next: null },
  meta: { current_page: 1, from: 1, last_page: 1, path: "", per_page: 10, to: rows.length, total: rows.length },
});

beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
});

describe("PaymentChannelListPage", () => {
  it("lists channels with their type and status", async () => {
    vi.spyOn(paymentChannelsService, "list").mockResolvedValue(paginated([channel()]));

    await renderRoute("/admin/payments");

    expect(await screen.findByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(await screen.findByText("BCA Virtual Account")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("is read-only: no action menu, no bulk-selection, no Action column", async () => {
    vi.spyOn(paymentChannelsService, "list").mockResolvedValue(paginated([channel()]));

    await renderRoute("/admin/payments");
    await screen.findByText("BCA Virtual Account");

    expect(screen.queryByRole("columnheader", { name: "Action" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
