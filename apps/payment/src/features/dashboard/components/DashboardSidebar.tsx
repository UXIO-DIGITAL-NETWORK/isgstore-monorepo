import { type ComponentType } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownToLine,
  Banknote,
  Bell,
  Boxes,
  CalendarClock,
  Coins,
  FileText,
  LayoutGrid,
  Receipt,
  Store,
  Wallet,
} from "lucide-react";

import { useBranding } from "@/hooks/useBranding";
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

// payment-admin (client): own data + request withdrawals.
const PAYMENT_ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutGrid },
  { label: "Transaksi", href: "/app/payment-admin/transactions", icon: Receipt },
  { label: "Penarikan", href: "/app/payment-admin/withdrawals", icon: ArrowDownToLine },
  { label: "Mutasi", href: "/app/payment-admin/mutations", icon: Wallet },
  { label: "Services", href: "/app/payment-admin/services", icon: Boxes },
  { label: "Status Layanan", href: "/app/payment-admin/service-status", icon: Activity },
];

// payment-internal (kita): all merchants, verification, and fee settings.
const PAYMENT_INTERNAL_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutGrid },
  { label: "Merchant", href: "/app/payment-internal/merchants", icon: Store },
  { label: "Transaksi", href: "/app/payment-internal/transactions", icon: Receipt },
  { label: "Verifikasi Penarikan", href: "/app/payment-internal/withdrawals", icon: ArrowDownToLine },
  { label: "Penarikan Internal", href: "/app/payment-internal/internal-withdrawals", icon: Banknote },
  { label: "Biaya Channel", href: "/app/payment-internal/channels", icon: Coins },
  { label: "Product / Services", href: "/app/payment-internal/services", icon: Boxes },
  { label: "Invoice", href: "/app/payment-internal/invoices", icon: FileText },
  { label: "Subscription", href: "/app/payment-internal/subscriptions", icon: CalendarClock },
  { label: "Status Layanan", href: "/app/payment-internal/incidents", icon: Activity },
  { label: "Notifikasi", href: "/app/payment-internal/notifications", icon: Bell },
];

export function DashboardSidebar() {
  const { siteName } = useBranding();

  const { pathname } = useLocation();
  const user = useAuthStore((state) => state.user);
  const isInternal = user?.role === ROLES.INTERNAL;
  const items = isInternal ? PAYMENT_INTERNAL_NAV : PAYMENT_ADMIN_NAV;

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
            {siteName}
          </Text>
        </Box>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{isInternal ? "Payment Internal" : "Payment Admin"}</SidebarGroupLabel>
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
