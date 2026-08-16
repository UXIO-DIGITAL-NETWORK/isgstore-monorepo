import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Plug,
  TrendingUp,
  Activity,
  Settings,
  LogOut,
} from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";
import { clearClientSession } from "@/lib/session";

interface SidebarNavItem {
  key: string;
  labelKey: string;
  icon: React.ReactNode;
  href?: string;
}

export default function DashboardSidebar(): React.JSX.Element {
  const { t } = useTranslation("dashboard");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const { location } = useRouterState();
  const navigate = useNavigate();

  const navItems: SidebarNavItem[] = [
    {
      key: "dashboard",
      labelKey: "sidebar.dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
      href: `/${locale}/dashboard`,
    },
    {
      key: "transactions",
      labelKey: "sidebar.transactions",
      icon: <Receipt className="w-4 h-4" />,
      href: `/${locale}/riwayat-transaksi`,
    },
    {
      key: "topUpBalance",
      labelKey: "sidebar.topUpBalance",
      icon: <Wallet className="w-4 h-4" />,
      href: `/${locale}/isi-saldo`,
    },
    {
      key: "integrations",
      labelKey: "sidebar.integrations",
      icon: <Plug className="w-4 h-4" />,
      href: `/${locale}/integrasi`,
    },
    {
      key: "upgradeMembership",
      labelKey: "sidebar.upgradeMembership",
      icon: <TrendingUp className="w-4 h-4" />,
      href: `/${locale}/upgrade-membership`,
    },
    {
      key: "activityLog",
      labelKey: "sidebar.activityLog",
      icon: <Activity className="w-4 h-4" />,
      href: `/${locale}/log-aktivitas`,
    },
    {
      key: "accountSettings",
      labelKey: "sidebar.accountSettings",
      icon: <Settings className="w-4 h-4" />,
      href: `/${locale}/pengaturan-akun`,
    },
  ];

  const handleLogout = () => {
    clearClientSession();
    navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
  };

  const isActive = (href?: string): boolean => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  return (
    <Box className="w-full flex flex-col gap-1">
      {/* Nav items */}
      {navItems.map((item) => {
        const active = isActive(item.href);
        const content = (
          <Box
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
              active
                ? "bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-white shadow-glow-violet"
                : "text-white/60 hover:bg-white/6 hover:text-white",
            )}
          >
            <Box className="flex items-center gap-3">
              <Box
                className={cn(
                  "transition-colors",
                  active ? "text-white" : "text-white/50 group-hover:text-white",
                )}
              >
                {item.icon}
              </Box>
              <Text
                as="span"
                className={cn(
                  "text-[13px] font-outfit font-medium leading-none",
                  active ? "text-white" : "text-white/60 group-hover:text-white",
                )}
              >
                {t(item.labelKey)}
              </Text>
            </Box>
            <Text
              as="span"
              className={cn(
                "text-xs opacity-60",
                active ? "text-white" : "text-white/30",
              )}
            >
              ›
            </Text>
          </Box>
        );

        return item.href ? (
          <Link key={item.key} href={item.href} className="no-underline block">
            {content}
          </Link>
        ) : (
          <Box key={item.key}>{content}</Box>
        );
      })}

      {/* Logout button */}
      <Box className="mt-4 pt-4 border-t border-white/8">
        <Box
          as="button"
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#EF4444]/30 bg-transparent text-[#EF4444] hover:bg-[#EF4444]/10 transition-all duration-200 cursor-pointer group"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <Text as="span" className="text-[13px] font-outfit font-medium text-[#EF4444] leading-none">
            {t("sidebar.logout")}
          </Text>
          <Text as="span" className="ml-auto text-xs text-[#EF4444]/50">→</Text>
        </Box>
      </Box>
    </Box>
  );
}
