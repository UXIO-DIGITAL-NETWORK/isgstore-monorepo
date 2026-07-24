import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "automatic", label: "Automatic", href: "/admin/transactions/automatic" },
  { value: "manual", label: "Manual", href: "/admin/transactions/manual" },
];

/**
 * Shell for the two Transaction tabs (product_requirements.md §4.3) — real
 * nested routes, not client-side tab state, so the tab reflects the actual
 * URL/breadcrumb ("Transaction › Automatic").
 */
export function TransactionsLayout() {
  const { pathname } = useLocation();
  const activeTab = TABS.find((tab) => pathname.startsWith(tab.href))?.value ?? "automatic";
  // The nested Edit Transaction page is a full-page form, not a third tab —
  // same escape hatch CategoryTabsLayout uses for Add Category.
  const onEditRoute = pathname.endsWith("/edit");

  return (
    <Box className="flex flex-col gap-6">
      {!onEditRoute && (
        <Tabs value={activeTab}>
          <TabsList variant="line">
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
