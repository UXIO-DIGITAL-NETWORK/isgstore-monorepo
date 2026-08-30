import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProviderStatusBadge } from "./ProviderStatusBadge";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import type { ProviderStatus, PaymentStatus } from "../types/transaction.type";

describe("ProviderStatusBadge", () => {
  it.each<[ProviderStatus, string]>([
    ["not_ordered", "Not Ordered"],
    ["queued", "Queued"],
    ["sending", "Sending"],
    ["ordered", "In Progress"],
    ["unconfirmed", "Unconfirmed"],
    ["delivered", "Delivered"],
    ["rejected", "Rejected"],
    ["undelivered", "No Response"],
  ])("labels %s", (status, label) => {
    render(<ProviderStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("separates a supplier refusal from a missing verdict", () => {
    // The distinction the single status column could not make. One is worth
    // retrying by hand, the other is not, so they must never read alike.
    const { unmount } = render(<ProviderStatusBadge status="rejected" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    unmount();

    render(<ProviderStatusBadge status="undelivered" />);
    expect(screen.getByText("No Response")).toBeInTheDocument();
    expect(screen.queryByText("Rejected")).not.toBeInTheDocument();
  });

  it("gives an unconfirmed order its own tone, neither working nor failed", () => {
    render(<ProviderStatusBadge status="unconfirmed" />);

    // Asserting the tone class specifically: shadcn's Badge base already
    // mentions `destructive` for its aria-invalid ring, so a loose match here
    // would pass on every status.
    const badge = screen.getByText("Unconfirmed");
    expect(badge.className).toMatch(/\btext-chart-1\b/);
    expect(badge.className).not.toMatch(/\btext-destructive\b/);
    expect(badge.className).not.toMatch(/\btext-success\b/);
  });
});

describe("PaymentStatusBadge", () => {
  it.each<[PaymentStatus, string]>([
    ["pending", "Unpaid"],
    ["success", "Paid"],
    ["expired", "Expired"],
    ["refunded", "Refunded"],
    ["none", "No Gateway"],
  ])("labels %s", (status, label) => {
    render(<PaymentStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("does not colour a gateway-less order as a failure", () => {
    render(<PaymentStatusBadge status="none" />);

    // A manually recorded order is not a failed payment; it never had one.
    expect(screen.getByText("No Gateway").className).not.toMatch(/\btext-destructive\b/);
  });
});
