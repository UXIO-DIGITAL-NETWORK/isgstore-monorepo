import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "automatic", label: "Automatic", href: "/transactions/automatic" },
  { value: "manual", label: "Manual", href: "/transactions/manual" },
];

/**
 * Shell for the two Transaction tabs (product_requirements.md §4.3) — real
 * nested routes, not client-side tab state, so the tab reflects the actual
 * URL/breadcrumb ("Transaction › Automatic").
 */
export function TransactionsLayout() {
  const { pathname } = useLocation();
  const activeTab = TABS.find((tab) => pathname.startsWith(tab.href))?.value ?? "automatic";

  return (
    <Box className="flex flex-col gap-6">
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
      <Outlet />
    </Box>
  );
}
