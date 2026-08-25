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
// ("Category › Sub Category", "Category › Sub Category › Add Sub Category")
// — every other route keeps the single-title lookup below.
const CATEGORY_TAB_LABELS: Record<string, string> = {
  category: "Category",
  "sub-category": "Sub Category",
  "category-type": "Category Type",
  "category-server": "Category Server",
  "category-provider": "Category Provider",
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
  // The leaf is derived from the active tab, not hardcoded: the reference
  // showed "Add Category" on every tab's add page, which is wrong anywhere
  // but the Category tab (product_requirements.md §4.5).
  const leaf = segments[segments.length - 1];
  if (leaf === "add") trail.push(`Add ${tabLabel}`);
  else if (leaf === "edit") trail.push(`Edit ${tabLabel}`);
  return trail;
}

// Tab segment -> breadcrumb label, mirrors TransactionsLayout's TABS. The
// preview seam is flat (no tab segment), and only ever renders the Automatic
// table, so an unrecognised first segment falls back to "Automatic".
const TRANSACTION_TAB_LABELS: Record<string, string> = {
  automatic: "Automatic",
  manual: "Manual",
};

function getTransactionBreadcrumb(pathname: string): string[] | null {
  // Same preview-first ordering caveat as getCategoryBreadcrumb, for the same
  // reason: distinct prefixes here, but keeping one shape avoids a trap later.
  const base = pathname.startsWith("/admin/transaction-preview")
    ? "/admin/transaction-preview"
    : pathname.startsWith("/admin/transactions")
      ? "/admin/transactions"
      : null;
  if (!base) return null;

  const segments = pathname.slice(base.length).split("/").filter(Boolean);
  const trail = ["Transaction", TRANSACTION_TAB_LABELS[segments[0] ?? "automatic"] ?? "Automatic"];
  if (segments[segments.length - 1] === "edit") trail.push("Edit Transaction");
  return trail;
}

// Tab segment -> breadcrumb label, mirrors ProductTabsLayout's TAB_SEGMENTS.
const PRODUCT_TAB_LABELS: Record<string, string> = {
  main: "Main Products",
  provider: "Product Provider",
  "price-log": "Price Change Log",
};

function getProductBreadcrumb(pathname: string): string[] | null {
  // "/admin/products-preview" also starts with "/admin/products", so the
  // preview base must be tested first — the same trap as getCategoryBreadcrumb.
  const base = pathname.startsWith("/admin/products-preview")
    ? "/admin/products-preview"
    : pathname.startsWith("/admin/products")
      ? "/admin/products"
      : null;
  if (!base) return null;

  const segments = pathname.slice(base.length).split("/").filter(Boolean);
  const tabLabel = PRODUCT_TAB_LABELS[segments[0] ?? "main"] ?? "Main Products";
  const trail = ["Product", tabLabel];
  const leaf = segments[segments.length - 1];
  if (leaf === "add") trail.push(`Add ${tabLabel}`);
  else if (leaf === "edit") trail.push(`Edit ${tabLabel}`);
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

  const trail = getCategoryBreadcrumb(pathname) ?? getTransactionBreadcrumb(pathname) ?? getProductBreadcrumb(pathname);

  return (
    <Box
      as="header"
      className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6"
    >
      <Box className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        {trail ? (
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap text-sm">
              {trail.map((label, index) => (
                <Fragment key={`${label}-${index}`}>
                  <BreadcrumbItem>
                    {index === trail.length - 1 ? (
                      <BreadcrumbPage className="font-medium">{label}</BreadcrumbPage>
                    ) : (
                      label
                    )}
                  </BreadcrumbItem>
                  {index < trail.length - 1 && <BreadcrumbSeparator />}
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
