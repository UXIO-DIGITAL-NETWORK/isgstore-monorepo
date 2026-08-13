import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SecretValue } from "@/components/common/SecretValue";
import type { ServiceInstallationDetail } from "@/types/service.type";

const SECRET = "sk_live_ABCDEF3f9a";

const secret: ServiceInstallationDetail = {
  id: 6,
  label: "API Key",
  // The API never sends a secret's plaintext in a list — only the mask.
  value: null,
  masked_value: "••••••••3f9a",
  is_secret: true,
  sort_order: 2,
};

const plain: ServiceInstallationDetail = {
  id: 5,
  label: "Username",
  value: "uxio-prod",
  masked_value: "uxio-prod",
  is_secret: false,
  sort_order: 1,
};

beforeEach(() => vi.clearAllMocks());

describe("SecretValue", () => {
  it("shows only the mask until it is revealed", () => {
    const reveal = vi.fn();
    render(
      <SecretValue
        detail={secret}
        reveal={reveal}
      />,
    );

    expect(screen.getByText("••••••••3f9a")).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
    expect(reveal).not.toHaveBeenCalled();
  });

  it("fetches the plaintext once and hides it again without a second fetch", async () => {
    const user = userEvent.setup();
    const reveal = vi.fn().mockResolvedValue(SECRET);

    render(
      <SecretValue
        detail={secret}
        reveal={reveal}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tampilkan API Key" }));
    expect(await screen.findByText(SECRET)).toBeInTheDocument();
    expect(reveal).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Sembunyikan API Key" }));
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
    // Hiding is local state; it must not cost another round trip.
    expect(reveal).toHaveBeenCalledTimes(1);
  });

  it("copies the plaintext of a secret", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const reveal = vi.fn().mockResolvedValue(SECRET);

    render(
      <SecretValue
        detail={secret}
        reveal={reveal}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Salin API Key" }));

    expect(writeText).toHaveBeenCalledWith(SECRET);
  });

  /** A plain value is already in hand; asking the server for it would be odd. */
  it("never calls reveal for a non-secret", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    const reveal = vi.fn();

    render(
      <SecretValue
        detail={plain}
        reveal={reveal}
      />,
    );

    expect(screen.getByText("uxio-prod")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tampilkan/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salin Username" }));

    expect(writeText).toHaveBeenCalledWith("uxio-prod");
    expect(reveal).not.toHaveBeenCalled();
  });
});
