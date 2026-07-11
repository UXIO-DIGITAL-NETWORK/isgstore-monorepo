import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "category", label: "Category", href: "/categories/category" },
  { value: "sub-category", label: "Sub Category", href: "/categories/sub-category" },
  { value: "category-type", label: "Category Type", href: "/categories/category-type" },
  { value: "server-category", label: "Server Category", href: "/categories/server-category" },
  { value: "supplier-category", label: "Supplier Category", href: "/categories/supplier-category" },
];

/**
 * Shell for the five Category tabs (product_requirements.md §4.5) — real
 * nested routes, not client-side tab state, so the breadcrumb reflects the
 * actual URL ("Category › Category"). The tab list is hidden on the Add
 * Category sub-route (matches the reference, which shows no tabs there).
 */
export function CategoryTabsLayout() {
  const { pathname } = useLocation();
  const activeTab = TABS.find((tab) => pathname.startsWith(tab.href))?.value ?? "category";
  const onAddRoute = pathname.endsWith("/add");

  return (
    <Box className="flex flex-col gap-6">
      {!onAddRoute && (
        <Tabs value={activeTab}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                asChild
              >
                <Link href={tab.href}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <Outlet />
    </Box>
  );
}
