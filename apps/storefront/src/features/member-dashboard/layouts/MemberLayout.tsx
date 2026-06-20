import React from "react";
import { Outlet } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import DashboardSidebar from "@/features/member-dashboard/components/DashboardSidebar";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/common/Text";

interface MemberLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

export function MemberLayout({ children, className }: MemberLayoutProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <Box className={cn("min-h-dvh bg-[#0A0A0C] flex flex-col", className)}>
      <Navbar />

      {/* Main content area */}
      <Box className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8">
        <Box className="flex gap-6 items-start">
          {/* ── Sidebar ── */}
          <Box className="hidden md:flex shrink-0 w-50 flex-col">
            {/* Gradient border card */}
            <Box className="p-px rounded-2xl bg-linear-to-br from-[#3B82F6] to-[#9234EA]">
              <Box className="bg-[#0C0E1A] rounded-[15px] p-3">
                <Text
                  as="span"
                  className="block px-4 py-2 text-[11px] font-outfit font-semibold text-white/30 uppercase tracking-widest leading-none mb-1"
                >
                  {t("title")}
                </Text>
                <DashboardSidebar />
              </Box>
            </Box>
          </Box>

          {/* ── Page content: children in standalone mode, <Outlet/> in router mode ── */}
          <Box className="flex-1 min-w-0">
            {children ?? <Outlet />}
          </Box>
        </Box>
      </Box>

      <Footer />
    </Box>
  );
}
