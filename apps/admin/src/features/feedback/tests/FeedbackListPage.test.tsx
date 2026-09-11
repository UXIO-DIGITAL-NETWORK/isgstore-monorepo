import { describe, it, expect, beforeEach } from "vitest";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Feedback — customer ratings served by fakeApi's `/v1/ratings` fixture (one
 * member row, one guest row). Asserts the table renders both, and that a guest
 * review shows its generated name plus a Guest badge.
 */
describe("FeedbackListPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  it("renders the header and the feedback table columns", async () => {
    await renderRoute("/admin/feedback");

    expect(await screen.findByRole("heading", { name: /feedback/i })).toBeInTheDocument();

    const table = await screen.findByRole("table");
    for (const header of ["Reviewer", "Rating", "Comment", "Product", "Time"]) {
      expect(within(table).getByText(header)).toBeInTheDocument();
    }
  });

  it("shows a member review and a guest review with its badge", async () => {
    await renderRoute("/admin/feedback");

    expect(await screen.findByText("Budi Santoso")).toBeInTheDocument();
    expect(screen.getByText("Guest K48213")).toBeInTheDocument();
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("Mobile Legends 100 Diamond")).toBeInTheDocument();
  });
});
