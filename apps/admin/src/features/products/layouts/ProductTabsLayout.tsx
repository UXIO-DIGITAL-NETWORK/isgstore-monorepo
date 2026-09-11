import { useTranslation } from "react-i18next";
import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_SEGMENTS = [
  { value: "main", labelKey: "tabMainProducts", segment: "main" },
  { value: "provider", labelKey: "colProductProvider", segment: "provider" },
  { value: "price-log", labelKey: "tabPriceChangeLog", segment: "price-log" },
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
  const { t } = useTranslation("products");
  // `/admin/products-preview` also starts with `/admin/products`, so the
  // preview base must be tested first.
  const { pathname } = useLocation();
  const base = pathname.startsWith(PREVIEW_BASE) ? PREVIEW_BASE : REAL_BASE;
  const activeSegment = pathname.slice(base.length).split("/").filter(Boolean)[0];
  const activeTab = TAB_SEGMENTS.find((tab) => tab.segment === activeSegment)?.value ?? "main";
  // Form/action routes render standalone (no tab bar): the add flows plus the
  // dedicated Set Profit Margin / Set Price Limit pages.
  const onFormRoute =
    pathname.endsWith("/add") ||
    pathname.endsWith("/add-bulk") ||
    pathname.endsWith("/edit") ||
    pathname.includes("/set-profit-margin") ||
    pathname.includes("/set-price-limit");

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
                <Link href={`${base}/${tab.segment}`}>{t(tab.labelKey)}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <Outlet />
    </Box>
  );
}
