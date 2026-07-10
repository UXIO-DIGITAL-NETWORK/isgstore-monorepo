import { useEffect, useState, type ComponentType } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Command,
  CreditCard,
  FileStack,
  FileText,
  Globe,
  LayoutGrid,
  Megaphone,
  Package,
  Plug,
  Receipt,
  Search,
  Tag,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
      { label: "Reports", href: "/dashboard", icon: FileText },
      { label: "Financial", href: "/financial", icon: Wallet },
      { label: "Integration", href: "/dashboard", icon: Plug },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Transaction", href: "/transactions", icon: Receipt },
      { label: "Activity", href: "/dashboard", icon: Activity },
    ],
  },
  {
    label: "Products & Services",
    items: [
      { label: "Category", href: "/dashboard", icon: Tag },
      { label: "Product", href: "/dashboard", icon: Package },
      { label: "Payment", href: "/dashboard", icon: CreditCard },
      { label: "Membership", href: "/dashboard", icon: Users },
    ],
  },
  {
    label: "Marketing & Content Management",
    items: [
      { label: "Promo", href: "/dashboard", icon: Megaphone },
      { label: "Flash Sale", href: "/dashboard", icon: Zap },
      { label: "Website Content", href: "/dashboard", icon: Globe },
      { label: "Pages", href: "/dashboard", icon: FileStack },
    ],
  },
];

export function DashboardSidebar() {
  const [commandOpen, setCommandOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const goTo = (href: string) => {
    setCommandOpen(false);
    navigate({ to: href as unknown as string });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <Link href="/dashboard">
                <Box className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Command className="size-4" />
                </Box>
                <Box className="grid flex-1 text-left text-sm leading-tight">
                  <Text
                    as="span"
                    className="truncate text-base font-bold"
                  >
                    Admin Dashboard
                  </Text>
                  <Text
                    as="span"
                    className="truncate text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                  >
                    UXIOTOPUP
                  </Text>
                </Box>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Box className={cn("relative", state !== "collapsed" && "px-1")}>
          {state === "collapsed" ? (
            <Box
              as="button"
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Search"
              className="ring-offset-background flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Search className="size-4" />
            </Box>
          ) : (
            <Box
              as="button"
              type="button"
              onClick={() => setCommandOpen(true)}
              className="ring-offset-background flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Search className="size-4 shrink-0" />
              <Text
                as="span"
                className="flex-1 text-left"
              >
                Search
              </Text>
              <Text
                as="span"
                className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium"
              >
                ⌘F
              </Text>
            </Box>
          )}
        </Box>
      </SidebarHeader>

      <SidebarContent className="[&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "rounded-md",
                          isActive
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <Text as="span">{item.label}</Text>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <Box className="group-data-[collapsible=icon]:hidden flex flex-col gap-2 rounded-lg bg-accent p-4">
          <Text
            as="span"
            className="text-sm font-semibold text-foreground"
          >
            Subscribe to our newsletter
          </Text>
          <Text variant="small">Opt-in to receive updates and news about the sidebar.</Text>
          <Button
            size="sm"
            className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Subscribe
          </Button>
        </Box>
      </SidebarFooter>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
      >
        <CommandInput placeholder="Jump to a page..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_GROUPS.map((group) => (
            <CommandGroup
              key={group.label}
              heading={group.label}
            >
              {group.items.map((item) => (
                <CommandItem
                  key={item.label}
                  onSelect={() => goTo(item.href)}
                >
                  <item.icon className="mr-2 size-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </Sidebar>
  );
}
