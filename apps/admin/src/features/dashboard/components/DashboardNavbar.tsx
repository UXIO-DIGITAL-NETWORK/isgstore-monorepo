import { Fragment } from "react";
import { Bell, ChevronDown, HelpCircle, LogOut, Zap } from "lucide-react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Box } from "@/components/common/Box";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Text } from "@/components/common/Text";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/store/useAuthStore";

// Tab segment -> breadcrumb label, mirrors CategoryTabsLayout's TABS
// (features/categories/layouts/CategoryTabsLayout.tsx). Category is the only
// section with real nested routes deep enough to need a multi-segment trail
// ("Category › Category", "Category › Category › Add Category") — every
// other route keeps the single-title lookup below.
const CATEGORY_TAB_LABELS: Record<string, string> = {
  category: "Category",
  "sub-category": "Sub Category",
  "category-type": "Category Type",
  "server-category": "Server Category",
  "supplier-category": "Supplier Category",
};

function getCategoryBreadcrumb(pathname: string): string[] | null {
  // "/admin/categories-preview" also starts with the substring
  // "/admin/categories", so the preview base must be checked first or every
  // preview path would resolve to the (wrong, one-segment-short) real base.
  const base = pathname.startsWith("/admin/categories-preview")
    ? "/admin/categories-preview"
    : pathname.startsWith("/admin/categories")
      ? "/admin/categories"
      : null;
  if (!base) return null;

  const segments = pathname.slice(base.length).split("/").filter(Boolean);
  const tabLabel = CATEGORY_TAB_LABELS[segments[0] ?? "category"] ?? "Category";
  const trail = ["Category", tabLabel];
  if (segments[segments.length - 1] === "add") trail.push("Add Category");
  return trail;
}

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Pathname -> topbar breadcrumb title. No route-meta plumbing exists yet
// (see src/routes/), so this mirrors the sidebar's own useLocation-driven
// active-nav lookup rather than introducing a new mechanism.
const PAGE_TITLES: Record<string, string> = {
  "/admin/financial": "Financial",
  "/admin/integration": "Integration",
  "/admin/transactions": "Transaction",
};

function getPageTitle(pathname: string) {
  const match = Object.keys(PAGE_TITLES).find((path) => pathname === path || pathname.startsWith(`${path}/`));
  return match ? PAGE_TITLES[match] : "Dashboard";
}

export function DashboardNavbar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    useAuthStore.getState().clearAuth();
    navigate({ to: "/login" });
  };

  const categoryTrail = getCategoryBreadcrumb(pathname);

  return (
    <Box
      as="header"
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6"
    >
      <Box className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {categoryTrail ? (
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap text-sm">
              {categoryTrail.map((label, index) => (
                <Fragment key={`${label}-${index}`}>
                  <BreadcrumbItem>
                    {index === categoryTrail.length - 1 ? (
                      <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                    ) : (
                      label
                    )}
                  </BreadcrumbItem>
                  {index < categoryTrail.length - 1 && <BreadcrumbSeparator />}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        ) : (
          <Text
            as="span"
            className="text-sm font-medium text-foreground"
          >
            {getPageTitle(pathname)}
          </Text>
        )}
      </Box>

      <Box className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <HelpCircle className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Help
          </Text>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <Zap className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Quick actions
          </Text>
        </Button>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-md text-muted-foreground"
        >
          <Bell className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Notifications
          </Text>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="ml-1 h-auto items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Avatar size="sm">
                <AvatarFallback>{user ? getInitials(user.name) : ""}</AvatarFallback>
              </Avatar>
              <Box className="hidden flex-col items-start text-left sm:flex">
                <Text
                  as="span"
                  className="text-sm leading-tight font-medium text-foreground"
                >
                  {user?.name}
                </Text>
                <Text
                  as="span"
                  className="text-xs leading-tight text-muted-foreground"
                >
                  {user?.email}
                </Text>
              </Box>
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
            >
              <LogOut className="mr-2 size-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Box>
    </Box>
  );
}
