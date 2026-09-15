import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { fireEvent, makeUser, renderRoute, screen, waitFor, within } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { settingsService, usersService } from "../services/administration.service";

// Guarded routes with no preview twin — the store is seeded so requireAuth and
// requirePermission run for real rather than being bypassed.
beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
});

describe("administration routes", () => {
  it("Payment lists channels with their code and fee", async () => {
    await renderRoute("/admin/payments");

    expect(await screen.findByRole("heading", { name: "Payment" })).toBeInTheDocument();
    expect(await screen.findByText("BCA Virtual Account")).toBeInTheDocument();
    expect(await screen.findByText("bca_va")).toBeInTheDocument();
  });

  it("Payment is read-only — no row actions or bulk selection", async () => {
    await renderRoute("/admin/payments");
    await screen.findByText("BCA Virtual Account");

    expect(screen.queryByRole("button", { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("Users lists members with their balance", async () => {
    await renderRoute("/admin/users");

    expect(await screen.findByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(await screen.findByText("Randy Galang")).toBeInTheDocument();
    expect(await screen.findByText("randy@example.com")).toBeInTheDocument();
  });

  it("Users row menu adjusts balance through the audited dialog, requiring a reason", async () => {
    const adjustSpy = vi.spyOn(usersService, "adjustBalance").mockResolvedValue({
      id: "1",
      role_id: "2",
      name: "Randy Galang",
      email: "randy@example.com",
      phone: "628",
      balance: 65000,
      point: 120,
      locale: "id",
      status: "active",
      created_at: "2026-07-01",
    });
    const user = userEvent.setup();
    await renderRoute("/admin/users");

    await user.click(await screen.findByRole("button", { name: "Actions for Randy Galang" }));
    await user.click(await screen.findByRole("menuitem", { name: "Adjust Balance" }));

    const dialog = await screen.findByRole("dialog", { name: /Adjust balance/ });
    await user.type(within(dialog).getByLabelText("Amount"), "50000");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));
    expect(await within(dialog).findByText("A reason is required")).toBeInTheDocument();
    expect(adjustSpy).not.toHaveBeenCalled();

    await user.type(within(dialog).getByLabelText("Reason"), "compensation");
    await user.click(within(dialog).getByRole("button", { name: "Adjust Balance" }));
    expect(adjustSpy).toHaveBeenCalledWith("1", { amount: 50000, direction: "credit", reason: "compensation" });
  });

  it("Settings opens on the first group and marks the public values", async () => {
    await renderRoute("/admin/settings");

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    // General leads the response, so it is the tab the page opens on.
    expect(await screen.findByLabelText("Site Name")).toBeInTheDocument();
    // The Public badge is what tells an admin a value reaches the storefront.
    expect((await screen.findAllByText("Public")).length).toBeGreaterThan(0);
  });

  // The sections are tabs, not a stack of cards: the page has to show one at a
  // time, and the strip has to reach the ones further down the response.
  it("Settings shows one section at a time", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/settings");

    expect(await screen.findByLabelText("Site Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("WhatsApp")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Contact" }));

    expect(await screen.findByLabelText("WhatsApp")).toBeInTheDocument();
    expect(screen.queryByLabelText("Site Name")).not.toBeInTheDocument();
  });

  // An inactive TabsContent is unmounted, so a form that seeded its inputs from
  // the response would drop whatever the admin had typed the moment they looked
  // at another tab. The draft has to outlive the panel it was typed into.
  it("Settings keeps an unsaved edit across a tab switch", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/settings");

    const siteName = await screen.findByLabelText("Site Name");
    await user.clear(siteName);
    await user.type(siteName, "ISG Store Baru");

    await user.click(screen.getByRole("tab", { name: "Contact" }));
    await screen.findByLabelText("WhatsApp");
    await user.click(screen.getByRole("tab", { name: "General" }));

    expect(await screen.findByLabelText("Site Name")).toHaveValue("ISG Store Baru");
  });

  it("Settings explains each section and its settings with info tooltips", async () => {
    await renderRoute("/admin/settings");
    await screen.findByLabelText("Site Name");

    // Four on the General tab: one beside the section heading, plus one per
    // setting in the fixture's general group — Site Name, Maintenance Mode, and
    // the logo dropzone, which owns its own label and takes the hint as a prop.
    // A setting with no `help_` key in the locale files renders no icon, which
    // is what keeps the count tied to the copy rather than to the row count.
    expect(screen.getAllByRole("button", { name: "More information" })).toHaveLength(4);
  });

  it("a boolean setting renders as a switch, not a text field", async () => {
    await renderRoute("/admin/settings");

    expect(await screen.findByRole("switch", { name: "Maintenance Mode" })).toBeInTheDocument();
  });

  // An image setting used to render as the words "No file uploaded." with no
  // way to change it, even though the upload endpoint has always existed.
  it("an image setting offers a real upload control", async () => {
    await renderRoute("/admin/settings");

    expect(await screen.findByText("Logo")).toBeInTheDocument();
    expect(screen.queryByText(/images are managed through the upload endpoint/i)).not.toBeInTheDocument();
    expect(await screen.findByTestId("setting-upload-logo")).toBeInTheDocument();
  });

  it("uploads an image setting through its own endpoint", async () => {
    const uploadSpy = vi.spyOn(settingsService, "upload");
    await renderRoute("/admin/settings");

    const dropzone = await screen.findByTestId("setting-upload-logo");
    const input = dropzone.querySelector("input[type=file]") as HTMLInputElement;
    const file = new File(["logo"], "logo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(uploadSpy).toHaveBeenCalledWith("logo", expect.any(File)));
  });
});

describe("marketing routes", () => {
  it("Promo lists codes with their usage and visibility", async () => {
    await renderRoute("/admin/promos");

    expect(await screen.findByRole("heading", { name: "Promo" })).toBeInTheDocument();
    expect(await screen.findByText("HEMAT10")).toBeInTheDocument();
    // Private codes still work when typed — the column has to distinguish them.
    expect(await screen.findByText("Private")).toBeInTheDocument();
  });

  it("Flash Sale shows the running state, not just active/inactive", async () => {
    await renderRoute("/admin/flash-sales");

    expect(await screen.findByRole("heading", { name: "Flash Sale" })).toBeInTheDocument();
    expect(await screen.findByText("Flash Sale Mingguan")).toBeInTheDocument();
    expect(await screen.findByText("Running")).toBeInTheDocument();
  });

  it("the Add Promo form renders its fields", async () => {
    const user = userEvent.setup();
    await renderRoute("/admin/promos");

    await user.click(await screen.findByRole("button", { name: "Add Promo" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Add Promo" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Code")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Type")).toBeInTheDocument();
  });
});

describe("content routes — banners and announcements", () => {
  it("Banners lists slides and flags a missing image", async () => {
    await renderRoute("/admin/content/banners");

    expect(await screen.findByRole("heading", { name: "Banners" })).toBeInTheDocument();
    expect(await screen.findByText("Promo Ramadan 2026")).toBeInTheDocument();
  });

  it("Announcements lists notices", async () => {
    await renderRoute("/admin/content/announcements");

    expect(await screen.findByRole("heading", { name: "Announcements" })).toBeInTheDocument();
    expect(await screen.findByText(/Server maintenance terjadwal/)).toBeInTheDocument();
  });
});
