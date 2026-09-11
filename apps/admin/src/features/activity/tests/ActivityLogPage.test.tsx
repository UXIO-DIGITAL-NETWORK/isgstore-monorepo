import { describe, it, expect, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { renderRoute, screen, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { activityService } from "../services/activity.service";

/**
 * Activity Log — the admin-wide audit feed served by fakeApi's `/v1/activity-logs`
 * fixture. Asserts the page renders its table of real fixture rows and that the
 * search box narrows the query through the service.
 */
describe("ActivityLogPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ token: "test-token", permissions: ["*"] });
  });

  it("renders the header and the activity table columns", async () => {
    await renderRoute("/admin/activity");

    expect(await screen.findByRole("heading", { name: /activity/i })).toBeInTheDocument();

    const table = await screen.findByRole("table");
    for (const header of ["Actor", "Type", "Message", "IP Address", "Time"]) {
      expect(within(table).getByText(header)).toBeInTheDocument();
    }
  });

  it("shows a fixture row's actor and message", async () => {
    await renderRoute("/admin/activity");

    expect((await screen.findAllByText("Randy Galang")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Stock Update").length).toBeGreaterThan(0);
  });

  it("passes the typed search term to the service", async () => {
    const listSpy = vi.spyOn(activityService, "list");
    await renderRoute("/admin/activity");

    await screen.findByRole("table");
    const search = screen.getByPlaceholderText(/search/i);
    await userEvent.type(search, "Stock");

    await vi.waitFor(() =>
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ search: "Stock" })),
    );
    listSpy.mockRestore();
  });
});
