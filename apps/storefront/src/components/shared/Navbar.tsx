import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Gamepad2 } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { LOCALES } from "@/constants/locales";
import { getNavLinks } from "@/constants/navLinks";
import { useLocaleDropdown } from "@/hooks/useLocaleDropdown";
import { SearchBar } from "@/components/shared/SearchBar";
import { NavDropdown } from "@/components/shared/NavDropdown";

export function Navbar(): React.JSX.Element {
  const { t } = useTranslation("common");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const { langOpen, langRef, currentLocale, toggleLangOpen, switchLocale } =
    useLocaleDropdown();

  const navLinks = getNavLinks(locale);
  const { location } = useRouterState();

  /** Returns true when the given href matches or is a parent of the current path. */
  const isNavActive = (href: string): boolean => {
    const pathname = location.pathname;
    // Home route: exact match only (avoid matching every route)
    if (href === `/${locale}`) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <Box className="w-full bg-[#0A0A0C] sticky top-0 z-50">
      {/* ── Top tier ── */}
      <Box className="w-full">
        <Box className="max-w-6xl mx-auto px-4 md:px-8 h-19 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0">
            <Box className="w-9 h-9 rounded-full bg-linear-to-br from-violet-600 to-blue-500 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4.5 h-4.5 text-white" />
            </Box>
            <Text
              as="span"
              className="text-[22px] font-black text-white uppercase tracking-tight leading-none hidden sm:inline font-outfit"
            >
              TOPUP
              <Text as="span" className="text-[#9234EA] text-[22px]">GAME</Text>
            </Text>
          </Link>

          {/* Search bar — desktop */}
          <SearchBar className="hidden md:flex flex-1 max-w-2xl" />

          {/* Right actions */}
          <Box className="flex items-center gap-2 shrink-0">
            {/* Language selector */}
            <Box ref={langRef} className="relative">
              <Box
                as="button"
                type="button"
                onClick={toggleLangOpen}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer outline-none select-none"
              >
                <Text as="span" className="text-sm leading-none">{currentLocale.flag}</Text>
                <Text as="span" className="text-sm font-semibold text-white leading-none font-outfit">
                  {locale.toUpperCase()}
                </Text>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </Box>

              {langOpen && (
                <Box className="absolute right-0 top-full mt-1.5 bg-[#18182A] border border-white/10 rounded-xl overflow-hidden min-w-44 z-50 py-1">
                  {LOCALES.map((lang) => (
                    <Box
                      key={lang.code}
                      as="button"
                      type="button"
                      onClick={() => switchLocale(lang.code)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors cursor-pointer outline-none"
                    >
                      <Text as="span" className="text-base">{lang.flag}</Text>
                      <Text as="span" className="font-inter">{lang.label}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Login button */}
            <Link
              href={`/${locale}/login`}
              className="flex items-center justify-center h-9 px-5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shrink-0 leading-none font-outfit"
            >
              {t("action.login")}
            </Link>
          </Box>
        </Box>
      </Box>

      {/* ── Mobile search row ── */}
      <Box className="md:hidden px-4 pb-3">
        <SearchBar className="flex w-full" />
      </Box>

      {/* ── Bottom tier – nav links ── */}
      <Box className="w-full border-b border-white/6">
        <Box className="max-w-6xl mx-auto px-4 md:px-8 h-10 flex items-center gap-7 overflow-x-auto no-scrollbar">
          {navLinks.map((link) =>
            link.children ? (
              <NavDropdown
                key={link.labelKey}
                link={link as typeof link & { children: NonNullable<typeof link.children> }}
              />
            ) : (
              <Link
                key={link.labelKey}
                href={link.href}
                className={`text-xs md:text-[13px] whitespace-nowrap tracking-wide font-medium transition-colors font-outfit ${
                  isNavActive(link.href) ? "text-[#9234EA]" : "text-white/45 hover:text-white/80"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}
