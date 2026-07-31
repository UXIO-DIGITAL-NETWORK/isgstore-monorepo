import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { makeUser, renderRoute, screen } from "@/test/test-utils";
import { useAuthStore } from "@/store/useAuthStore";

// These routes are guarded, and unlike the older features there is no
// unauthenticated preview twin — so the store is seeded rather than the guard
// being bypassed, which means requireAuth/requirePermission run for real.
beforeEach(() => {
  useAuthStore.setState({ token: "test-token", user: makeUser(), permissions: ["*"] });
});

afterEach(() => {
  useAuthStore.setState({ token: null, user: null, permissions: [] });
});

/**
 * Reachability + content for the six content tabs.
 *
 * Rendered through the guarded routes with an authenticated store — unlike the
 * older features, this one has no unauthenticated preview twin, so there is no
 * second base to keep the tab hrefs inside.
 */
describe("content routes", () => {
  it("Articles tab renders its heading, toolbar and rows", async () => {
    await renderRoute("/admin/content/articles");

    expect(await screen.findByRole("heading", { name: "Articles" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search articles")).toBeInTheDocument();
    expect(await screen.findByText("Cara Top Up Diamond Lebih Hemat")).toBeInTheDocument();
  });

  // Articles and News are one table filtered by type — the News tab must not
  // show article-type rows, or the split would be cosmetic only.
  it("News tab shows only news-type entries", async () => {
    await renderRoute("/admin/content/news");

    expect(await screen.findByRole("heading", { name: "News" })).toBeInTheDocument();
    expect(await screen.findByText("Promo Spesial Hari Raya")).toBeInTheDocument();
    expect(screen.queryByText("Cara Top Up Diamond Lebih Hemat")).not.toBeInTheDocument();
  });

  it("Categories tab lists the storefront's filter keys", async () => {
    await renderRoute("/admin/content/categories");

    expect(await screen.findByRole("heading", { name: "Article Categories" })).toBeInTheDocument();
    expect(await screen.findByText("mobile-legend")).toBeInTheDocument();
  });

  it("FAQ tab renders its questions", async () => {
    await renderRoute("/admin/content/faqs");

    expect(await screen.findByRole("heading", { name: "FAQ" })).toBeInTheDocument();
    expect(await screen.findByText("Bagaimana cara melakukan top up?")).toBeInTheDocument();
  });

  it("Pages tab renders the static pages with their slugs", async () => {
    await renderRoute("/admin/content/pages");

    expect(await screen.findByRole("heading", { name: "Pages" })).toBeInTheDocument();
    expect(await screen.findByText("Kebijakan Privasi")).toBeInTheDocument();
    expect(await screen.findByText("/kebijakan-privasi")).toBeInTheDocument();
  });

  it("Testimonials tab renders its authors", async () => {
    await renderRoute("/admin/content/testimonials");

    expect(await screen.findByRole("heading", { name: "Testimonials" })).toBeInTheDocument();
    expect(await screen.findByText("Rizky Pratama")).toBeInTheDocument();
  });

  it("shows all six tabs so every section is reachable", async () => {
    await renderRoute("/admin/content/articles");

    for (const label of ["Articles", "News", "Categories", "FAQ", "Pages", "Testimonials"]) {
      expect(await screen.findByRole("tab", { name: label })).toBeInTheDocument();
    }
  });
});

describe("content form routes", () => {
  it("the Add Article form renders its fields", async () => {
    await renderRoute("/admin/content/articles/add");

    expect(await screen.findByRole("heading", { name: "Add Article" })).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    // The body is a section repeater, not a rich-text field — the API stores
    // structured sections so the storefront renderer stays unchanged.
    expect(screen.getByRole("button", { name: /Add Section/i })).toBeInTheDocument();
  });

  it("the Edit Article form pre-fills from the record in the URL", async () => {
    await renderRoute("/admin/content/articles/1/edit");

    expect(await screen.findByRole("heading", { name: "Edit Article" })).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Cara Top Up Diamond Lebih Hemat")).toBeInTheDocument();
  });

  it("the Add FAQ form renders its fields", async () => {
    await renderRoute("/admin/content/faqs/add");

    expect(await screen.findByRole("heading", { name: "Add FAQ" })).toBeInTheDocument();
    expect(screen.getByLabelText("Question")).toBeInTheDocument();
    expect(screen.getByLabelText("Answer")).toBeInTheDocument();
  });
});
