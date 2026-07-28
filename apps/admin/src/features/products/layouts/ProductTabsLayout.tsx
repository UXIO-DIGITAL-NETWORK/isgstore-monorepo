import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_SEGMENTS = [
  { value: "main", label: "Main Products", segment: "main" },
  { value: "provider", label: "Product Provider", segment: "provider" },
];

const PREVIEW_BASE = "/admin/products-preview";
const REAL_BASE = "/admin/products";

/**
 * Two URL-driven tabs (product_requirements.md §4.6) — real nested routes, not
 * client state, so the breadcrumb and back button reflect the active tab. Same
 * pattern as `TransactionsLayout`, which also has two.
 *
 * Segments are `main`/`provider` rather than the full label kebab, following
 * the two-tab Transactions precedent (`automatic`/`manual`); the five-tab
 * Categories layout spells its segments out because its labels are unique
 * nouns rather than qualifiers of the feature name.
 */
export function ProductTabsLayout() {
  // `/admin/products-preview` also starts with `/admin/products`, so the
  // preview base must be tested first.
  const { pathname } = useLocation();
  const base = pathname.startsWith(PREVIEW_BASE) ? PREVIEW_BASE : REAL_BASE;
  const activeSegment = pathname.slice(base.length).split("/").filter(Boolean)[0];
  const activeTab = TAB_SEGMENTS.find((tab) => tab.segment === activeSegment)?.value ?? "main";
  const onFormRoute = pathname.endsWith("/add") || pathname.endsWith("/edit");

  return (
    <Box className="flex flex-col gap-6">
      {!onFormRoute && (
        <Tabs value={activeTab}>
          <TabsList variant="line">
            {TAB_SEGMENTS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
              >
                <Link href={`${base}/${tab.segment}`}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <Outlet />
    </Box>
  );
}
