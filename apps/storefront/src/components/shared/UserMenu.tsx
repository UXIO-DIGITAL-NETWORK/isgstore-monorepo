import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Settings,
  LogOut,
  ChevronDown,
  Mail,
  Phone,
} from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { useAuthStore } from "@/store/useAuthStore";
import { clearClientSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function UserMenu(): React.JSX.Element {
  const { t } = useTranslation("common");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    clearClientSession();
    navigate({ to: "/$locale", params: { locale: locale ?? "id" } });
  };

  if (!user) return <></>;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <Box ref={menuRef} className="relative">
      {/* Trigger */}
      <Box
        as="button"
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 h-9 px-2 rounded-full hover:bg-white/6 transition-colors cursor-pointer outline-none select-none"
      >
        {/* Avatar */}
        <Box className="w-8 h-8 rounded-full bg-linear-to-br from-[#3B82F6] to-[#9234EA] flex items-center justify-center shrink-0">
          <Text as="span" className="text-[12px] font-outfit font-bold text-white leading-none">
            {initials}
          </Text>
        </Box>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-white/50 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Box>

      {/* Dropdown panel */}
      {open && (
        <Box className="absolute right-0 top-full mt-2 w-[260px] bg-[#18182A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* User identity */}
          <Box className="px-4 pt-4 pb-3 border-b border-white/8">
            <Box className="flex items-start justify-between gap-2">
              <Box className="flex flex-col gap-0.5 min-w-0">
                <Text
                  as="span"
                  className="font-outfit font-bold text-[15px] text-white leading-tight truncate"
                >
                  {user.name}
                </Text>
                <Box className="inline-flex mt-0.5">
                  <Box className="px-2 py-0.5 rounded-full bg-linear-to-r from-[#3B82F6]/20 to-[#9234EA]/20 border border-[#9234EA]/30">
                    <Text
                      as="span"
                      className="text-[9px] font-outfit font-bold text-[#C084FC] uppercase tracking-widest leading-none"
                    >
                      {t("userMenu.memberBadge")}
                    </Text>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box className="flex flex-col gap-1.5 mt-2.5">
              <Box className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-white/30 shrink-0" />
                <Text as="span" className="text-[12px] font-inter text-white/50 leading-none truncate">
                  {user.email}
                </Text>
              </Box>
              <Box className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-white/30 shrink-0" />
                <Text as="span" className="text-[12px] font-inter text-white/50 leading-none">
                  {user?.phone ?? ""}
                </Text>
              </Box>
            </Box>
          </Box>

          {/* Menu items */}
          <Box className="py-1.5">
            {/* Dashboard Member */}
            <Link
              href={`/${locale}/dashboard`}
              className="no-underline"
              onClick={() => setOpen(false)}
            >
              <Box className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors cursor-pointer">
                <LayoutDashboard className="w-4 h-4 text-white/40 shrink-0" />
                <Text as="span" className="text-[13px] font-inter text-white/80 leading-none">
                  {t("userMenu.dashboardMember")}
                </Text>
              </Box>
            </Link>

            {/* Isi Saldo — with balance chip */}
            <Box className="flex items-center justify-between px-4 py-2.5 hover:bg-white/6 transition-colors cursor-pointer">
              <Box className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-white/40 shrink-0" />
                <Text as="span" className="text-[13px] font-inter text-white/80 leading-none">
                  {t("userMenu.topUpBalance")}
                </Text>
              </Box>
              <Box className="px-2.5 py-0.5 rounded-full bg-white/8 border border-white/10">
                <Text as="span" className="text-[11px] font-plex font-bold text-white/70 leading-none">
                  {formatCurrency(user?.balance ?? 0, locale)}
                </Text>
              </Box>
            </Box>

            {/* Transaksi */}
            <Box className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors cursor-pointer">
              <Receipt className="w-4 h-4 text-white/40 shrink-0" />
              <Text as="span" className="text-[13px] font-inter text-white/80 leading-none">
                {t("userMenu.transactions")}
              </Text>
            </Box>

            {/* Pengaturan Akun */}
            <Link
              href={`/${locale}/pengaturan-akun`}
              className="no-underline"
              onClick={() => setOpen(false)}
            >
              <Box className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/6 transition-colors cursor-pointer">
                <Settings className="w-4 h-4 text-white/40 shrink-0" />
                <Text as="span" className="text-[13px] font-inter text-white/80 leading-none">
                  {t("userMenu.accountSettings")}
                </Text>
              </Box>
            </Link>
          </Box>

          {/* Logout */}
          <Box className="px-3 pb-3 pt-1 border-t border-white/8">
            <Box
              as="button"
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <Text as="span" className="text-[13px] font-inter leading-none text-[#EF4444]">
                {t("userMenu.logout")}
              </Text>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}
