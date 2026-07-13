import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_SEGMENTS = [
  { value: "category", label: "Category", segment: "category" },
  { value: "sub-category", label: "Sub Category", segment: "sub-category" },
  { value: "category-type", label: "Category Type", segment: "category-type" },
  { value: "server-category", label: "Server Category", segment: "server-category" },
  { value: "supplier-category", label: "Supplier Category", segment: "supplier-category" },
];

const PREVIEW_BASE = "/admin/categories-preview";
const REAL_BASE = "/admin/categories";

/**
 * Shell for the five Category tabs (product_requirements.md §4.5) — real
 * nested routes, not client-side tab state, so the breadcrumb reflects the
 * actual URL ("Category › Category"). The tab list is hidden on the Add
 * Category sub-route (matches the reference, which shows no tabs there).
 *
 * Reused under both the real route (`/admin/categories/*`) and the
 * unauthenticated preview route (`/admin/categories-preview/*`, which mirrors
 * the same nested shape) — tab hrefs are built from whichever base the
 * current pathname is under, so a preview tab click can never leak out into
 * the real, auth-guarded route. Check the preview base first:
 * "/admin/categories-preview" also starts with the substring
 * "/admin/categories".
 */
export function CategoryTabsLayout() {
  const { pathname } = useLocation();
  const base = pathname.startsWith(PREVIEW_BASE) ? PREVIEW_BASE : REAL_BASE;
  const activeSegment = pathname.slice(base.length).split("/").filter(Boolean)[0];
  const activeTab = TAB_SEGMENTS.find((tab) => tab.segment === activeSegment)?.value ?? "category";
  const onAddRoute = pathname.endsWith("/add");

  return (
    <Box className="flex flex-col gap-6">
      {!onAddRoute && (
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
