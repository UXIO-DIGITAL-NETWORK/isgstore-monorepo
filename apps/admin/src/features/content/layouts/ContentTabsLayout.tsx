import { Outlet, useLocation } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_SEGMENTS = [
  { value: "articles", label: "Articles", segment: "articles" },
  { value: "news", label: "News", segment: "news" },
  { value: "categories", label: "Categories", segment: "categories" },
  { value: "faqs", label: "FAQ", segment: "faqs" },
  { value: "pages", label: "Pages", segment: "pages" },
  { value: "banners", label: "Banners", segment: "banners" },
  { value: "announcements", label: "Announcements", segment: "announcements" },
  { value: "testimonials", label: "Testimonials", segment: "testimonials" },
];

const PREVIEW_BASE = "/admin/content-preview";
const REAL_BASE = "/admin/content";

/**
 * Shell for the content tabs — real nested routes rather than tab state, so
 * the URL and breadcrumb reflect which section is open.
 *
 * Tab hrefs are built from whichever base the current path is under, so a
 * click inside the unauthenticated preview route can never leak into the
 * guarded one. The preview base is checked first because "/admin/content-preview"
 * also starts with "/admin/content".
 */
export function ContentTabsLayout() {
  const { pathname } = useLocation();
  const base = pathname.startsWith(PREVIEW_BASE) ? PREVIEW_BASE : REAL_BASE;
  const activeSegment = pathname.slice(base.length).split("/").filter(Boolean)[0];
  const activeTab = TAB_SEGMENTS.find((tab) => tab.segment === activeSegment)?.value ?? "articles";

  return (
    <Box className="flex flex-col gap-6">
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
      <Outlet />
    </Box>
  );
}
