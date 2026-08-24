import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * "Add Product Provider" used to be a route of its own that browsed the
 * provider's entire price list. It is an in-page panel now — the pool page owns
 * it, filtered to the games mapped under Category Provider.
 *
 * Kept as a redirect for one release so existing links and bookmarks land
 * somewhere sensible instead of 404ing.
 */
export const Route = createFileRoute("/admin/_protected/products/provider/add/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/products/provider" });
  },
});
