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

const BASE = "/admin/content";

/**
 * Shell for the content tabs — real nested routes rather than tab state, so
 * the URL and breadcrumb reflect which section is open.
 *
 * Unlike Categories and Products, content has no unauthenticated preview
 * route: the `/admin/content-preview` base this once also matched was
 * copy-pasted from those layouts and never existed in the route tree, so the
 * branch could never be taken.
 */
export function ContentTabsLayout() {
  const { pathname } = useLocation();
  const base = BASE;
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
