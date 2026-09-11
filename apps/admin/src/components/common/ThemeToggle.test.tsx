import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";

import { ThemeProvider } from "@/providers/theme-provider";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Choosing a theme.
 *
 * The old control was a binary `light ⇄ dark` flip over three possible states.
 * Starting from "system" it computed `light`, so someone on a dark OS pressing
 * the moon got the light theme — and "system" could never be reached again.
 */
const STORAGE_KEY = "vite-ui-theme";

const renderToggle = () =>
  render(
    <ThemeProvider storageKey={STORAGE_KEY}>
      <ThemeToggle />
    </ThemeProvider>,
  );

const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: /theme/i }));
};

/** jsdom's matchMedia stub is in test/setup.ts; point it at a dark OS. */
const prefersDark = (dark: boolean) => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: dark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
};

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ThemeToggle", () => {
  it("applies the theme that was actually chosen, starting from system", async () => {
    // The regression: on a dark OS, the first press used to yield light.
    prefersDark(true);

    const user = userEvent.setup();
    renderToggle();

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: /^dark$/i }));

    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("can go back to following the operating system", async () => {
    prefersDark(true);

    const user = userEvent.setup();
    renderToggle();

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: /^light$/i }));
    expect(document.documentElement).toHaveClass("light");

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: /^system$/i }));

    // Back on the OS preference, which the stub says is dark.
    expect(document.documentElement).toHaveClass("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("system");
  });

  it("marks the active choice so the menu says which one is in force", async () => {
    const user = userEvent.setup();
    renderToggle();

    await openMenu(user);
    await user.click(screen.getByRole("menuitemradio", { name: /^light$/i }));
    await openMenu(user);

    expect(screen.getByRole("menuitemradio", { name: /^light$/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: /^dark$/i })).toHaveAttribute("aria-checked", "false");
  });
});
