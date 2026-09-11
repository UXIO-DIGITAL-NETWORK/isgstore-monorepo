import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";

import { LocaleSwitcher } from "@/components/common/LocaleSwitcher";
import i18n, { LOCALE_STORAGE_KEY } from "@/config/i18n";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { makeUser } from "@/test/test-utils";

/**
 * Choosing the panel's language.
 *
 * Three copies of the answer have to agree, and each one exists for a reason
 * the others cannot cover: i18next is what is on screen, `localStorage` is what
 * the next cold load starts in before any request returns, and `users.locale`
 * is what carries the choice to a different device and what the API reads to
 * decide which language to answer in.
 */
beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser({ locale: "en" }), permissions: ["*"] });
});

afterEach(async () => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
  vi.restoreAllMocks();
  await i18n.changeLanguage("en");
});

const pick = async (name: RegExp) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: /language/i }));
  await user.click(await screen.findByRole("menuitemradio", { name }));
};

describe("LocaleSwitcher", () => {
  it("changes the language on screen at once", async () => {
    // Not after a round trip: the panel must react to the click itself.
    render(<LocaleSwitcher />);

    await pick(/indonesia/i);

    expect(i18n.language).toBe("id");
    // The switcher's own label is now Indonesian, which proves the change
    // reached the tree rather than only the i18n instance.
    expect(await screen.findByRole("button", { name: /bahasa/i })).toBeInTheDocument();
  });

  it("remembers the choice for the next cold load", async () => {
    render(<LocaleSwitcher />);

    await pick(/indonesia/i);

    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("id");
  });

  it("stores the choice on the account so it follows the admin to another device", async () => {
    const update = vi.spyOn(authService, "updateLocale").mockResolvedValue({} as never);

    render(<LocaleSwitcher />);
    await pick(/indonesia/i);

    await waitFor(() => expect(update).toHaveBeenCalledWith("id"));
    expect(useAuthStore.getState().user?.locale).toBe("id");
  });

  it("keeps the chosen language even when the account cannot be updated", async () => {
    // A failed sync is mildly wrong and self-correcting on the next change.
    // Reverting the language someone just picked, or shouting at them with a
    // toast, would both be worse.
    vi.spyOn(authService, "updateLocale").mockRejectedValue(new Error("offline"));

    render(<LocaleSwitcher />);
    await pick(/indonesia/i);

    await waitFor(() => expect(i18n.language).toBe("id"));
  });

  it("adopts the language of the signed-in account", async () => {
    // The path that matters on a new device, where localStorage is empty: the
    // account is the authority, so the panel follows it rather than the machine.
    await i18n.changeLanguage("en");
    useAuthStore.setState({ token: "t", user: makeUser({ locale: "id" }), permissions: ["*"] });

    render(<LocaleSwitcher />);

    await waitFor(() => expect(i18n.language).toBe("id"));
  });
});
