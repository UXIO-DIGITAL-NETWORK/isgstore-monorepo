import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { PoolCandidatesPage } from "@/features/products";

/**
 * "Add Product Provider" — a page of its own, so the pool page is never two
 * tables at once. `ProductTabsLayout` hides the tab bar for any path ending in
 * `/add`, so this renders standalone with no layout change.
 *
 * Gated on `products.create`: the entry button carried that check, and the
 * parent route only requires `products.view` — without this the gate would be
 * lost the moment it stopped being a button.
 */
export const Route = createFileRoute("/admin/_protected/products/provider/add/")({
  beforeLoad: () => requirePermission("products.create"),
  component: PoolCandidatesPage,
});
