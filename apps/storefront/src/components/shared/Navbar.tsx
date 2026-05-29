import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Search, ChevronDown, Gamepad2 } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";

const LOCALES = [
  { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { code: "en", flag: "🇺🇸", label: "English" },
] as const;

export function Navbar(): React.JSX.Element {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { locale = "id" } = (useParams({ strict: false }) as { locale?: string });

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langOpen]);

  const switchLocale = (newLocale: string) => {
    setLangOpen(false);
    navigate({ to: "/$locale", params: { locale: newLocale } });
  };

  const navLinks = [
    { labelKey: "nav.topup", href: `/${locale}` },
    { labelKey: "nav.checkOrder", href: `/${locale}/cek-pesanan` },
    { labelKey: "nav.priceList", href: `/${locale}/daftar-harga` },
    { labelKey: "nav.leaderboard", href: `/${locale}/leaderboard` },
    { labelKey: "nav.news", href: `/${locale}/berita` },
    { labelKey: "nav.calculator", href: `/${locale}/kalkulator` },
  ];

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

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

          {/* Search bar */}
          <Box className="relative flex-1 max-w-2xl hidden md:flex items-center">
            <Box
              as="input"
              type="text"
              placeholder={t("action.search")}
              className="w-full h-10 bg-white/5 border border-white/8 rounded-full pl-5 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/8 focus:border-white/20 transition-all font-inter"
            />
            <Search className="absolute right-4 text-white/35 w-4.5 h-4.5 pointer-events-none" />
          </Box>

          {/* Right actions */}
          <Box className="flex items-center gap-2 shrink-0">
            {/* Language selector */}
            <Box ref={langRef} className="relative">
              <Box
                as="button"
                type="button"
                onClick={() => setLangOpen((v) => !v)}
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

      {/* ── Bottom tier – nav links ── */}
      <Box className="w-full border-b border-white/6">
        <Box className="max-w-6xl mx-auto px-4 md:px-8 h-10 flex items-center gap-7 overflow-x-auto no-scrollbar">
          {navLinks.map((link, index) => (
            <Link
              key={link.labelKey}
              href={link.href}
              className={`text-xs md:text-[13px] whitespace-nowrap tracking-wide font-medium transition-colors font-outfit ${
                index === 0 ? "text-[#9234EA]" : "text-white/45 hover:text-white/80"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
