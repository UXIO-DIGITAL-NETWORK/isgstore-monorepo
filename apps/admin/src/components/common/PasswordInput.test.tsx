import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PasswordInput } from "./PasswordInput";

/**
 * The show/hide toggle. Two things matter: it actually flips the input's type
 * both ways, and it can never submit the form it sits in.
 */
describe("PasswordInput", () => {
  it("hides the value until the toggle is pressed, and hides it again", async () => {
    const user = userEvent.setup();
    render(
      <PasswordInput
        aria-label="Password"
        defaultValue="secret"
      />,
    );

    const field = screen.getByLabelText("Password");
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(field).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(field).toHaveAttribute("type", "password");
  });

  it("never submits the form it sits in", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <PasswordInput aria-label="Password" />
      </form>,
    );

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
