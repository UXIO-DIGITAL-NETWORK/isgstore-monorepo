import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { feedbackService } from "../services/feedback.service";

/**
 * Moderation is the one write the Feedback page has: an admin cannot author or
 * edit a review — that would put admin-written text into `ratings`, which the
 * API keeps strictly purchase-linked — but must be able to remove spam and
 * abuse. Delete is therefore gated, confirmed, and irreversible.
 */
describe("Feedback delete flow", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not delete until the confirmation is accepted", async () => {
    const removeSpy = vi.spyOn(feedbackService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRoute("/admin/feedback");

    await user.click(await screen.findByRole("button", { name: /Actions for Budi Santoso/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText("Delete this review?")).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith("1");
  });

  it("cancelling the confirmation deletes nothing", async () => {
    const removeSpy = vi.spyOn(feedbackService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRoute("/admin/feedback");

    await user.click(await screen.findByRole("button", { name: /Actions for Budi Santoso/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(removeSpy).not.toHaveBeenCalled();
  });

  it("can delete a guest review by its generated name", async () => {
    const removeSpy = vi.spyOn(feedbackService, "remove").mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRoute("/admin/feedback");

    await user.click(await screen.findByRole("button", { name: /Actions for Guest K48213/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(removeSpy).toHaveBeenCalledWith("2");
  });

  it("hides the row menu without the delete permission", async () => {
    useAuthStore.setState({ token: "test-token", permissions: ["feedback.view"] });
    renderRoute("/admin/feedback");

    await screen.findByText("Budi Santoso");

    expect(screen.queryByRole("button", { name: /Actions for Budi Santoso/i })).not.toBeInTheDocument();
  });
});
