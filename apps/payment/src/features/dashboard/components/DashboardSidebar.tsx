import { type ComponentType } from "react";
import { useLocation } from "@tanstack/react-router";
import { ArrowDownToLine, LayoutGrid, Receipt, Store, Wallet } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROLES } from "@/constants/roles";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: ComponentType<{ className?: string }> };

const MERCHANT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutGrid },
  { label: "Transaksi", href: "/app/transactions", icon: Receipt },
  { label: "Penarikan", href: "/app/withdrawals", icon: ArrowDownToLine },
  { label: "Mutasi", href: "/app/mutations", icon: Wallet },
];

const FINANCE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutGrid },
  { label: "Merchant", href: "/app/finance/merchants", icon: Store },
  { label: "Transaksi", href: "/app/finance/transactions", icon: Receipt },
  { label: "Penarikan", href: "/app/finance/withdrawals", icon: ArrowDownToLine },
];

export function DashboardSidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const isFinance = user?.role === ROLES.FINANCE;
  const items = isFinance ? FINANCE_NAV : MERCHANT_NAV;

  return (
    <Sidebar>
      <SidebarHeader>
        <Box className="flex items-center gap-2 px-2 py-1.5">
          <Box className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </Box>
          <Text
            as="span"
            className="text-base font-semibold"
          >
            Uxio Pay
          </Text>
        </Box>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isFinance ? "Finance" : "Merchant"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                    >
                      <Link
                        href={item.href}
                        className={cn("flex items-center gap-2", active ? "text-foreground" : "text-muted-foreground")}
                      >
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
      </SidebarContent>
    </Sidebar>
  );
}
