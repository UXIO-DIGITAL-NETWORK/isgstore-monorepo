import { ProvisionalTabPage } from "./ProvisionalTabPage";

/** Fifth tab. Named "Supplier Category" until 2026-07-27 — the clearer
 * reference in the Sub Category round shows the real label is "Category
 * Provider" (product_requirements.md §4.5, line 188). */
export default function CategoryProviderPage() {
  return (
    <ProvisionalTabPage
      title="Category Provider"
      subcopy="Maps categories to the upstream providers that fulfil them, for provider/SKU routing."
    />
  );
}
