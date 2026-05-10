import React, { useState, useRef, useEffect } from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { Search, ChevronDown, Gamepad2 } from "lucide-react";

type NavigationLink = {
  name: string;
  href: string;
};

const navLinks: NavigationLink[] = [
  { name: "TOPUP", href: "/" },
  { name: "CEK PESANAN", href: "/cek-pesanan" },
  { name: "DAFTAR HARGA", href: "/daftar-harga" },
  { name: "LEADERBOARD", href: "/leaderboard" },
  { name: "BERITA", href: "/berita" },
  { name: "KALKULATOR", href: "/kalkulator" },
];

type Language = {
  code: string;
  flag: string;
  label: string;
};

const languages: Language[] = [
  { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" },
  { code: "en", flag: "🇺🇸", label: "English" },
];

export function Navbar(): React.JSX.Element {
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

  return (
    <Box className="w-full bg-[#0B0A11] sticky top-0 z-50">
      {/* ── Top tier ── */}
      <Box className="w-full border-b border-white/6">
        <Box className="max-w-6xl mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
          >
            <Box className="w-9 h-9 rounded-full bg-linear-to-br from-violet-600 to-blue-500 flex items-center justify-center shrink-0">
              <Gamepad2 className="w-[18px] h-[18px] text-white" />
            </Box>
            <Text
              as="span"
              className="text-[22px] font-black text-white uppercase tracking-tight leading-none hidden sm:inline"
            >
              TOPUP<span className="text-violet-500">GAME</span>
            </Text>
          </Link>

          {/* Search bar */}
          <Box className="relative flex-1 max-w-2xl hidden md:flex items-center">
            <Box
              as="input"
              type="text"
              placeholder="Cari game untuk top up..."
              className="w-full h-10 bg-white/6 border border-white/8 rounded-full pl-5 pr-11 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/8 focus:border-white/20 transition-all"
            />
            <Search className="absolute right-4 text-white/35 w-[17px] h-[17px] pointer-events-none" />
          </Box>

          {/* Right actions */}
          <Box className="flex items-center gap-2 shrink-0">
            {/* Language selector */}
            <Box
              ref={langRef}
              className="relative"
            >
              <Box
                as="button"
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/6 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer outline-none select-none"
              >
                <Text
                  as="span"
                  className="text-sm leading-none"
                >
                  🇮🇩
                </Text>
                <Text
                  as="span"
                  className="text-sm font-semibold text-white leading-none"
                >
                  ID
                </Text>
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              </Box>

              {langOpen && (
                <Box className="absolute right-0 top-full mt-1.5 bg-[#18182A] border border-white/10 rounded-xl overflow-hidden min-w-[176px] z-50 py-1">
                  {languages.map((lang) => (
                    <Box
                      key={lang.code}
                      as="button"
                      type="button"
                      onClick={() => setLangOpen(false)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors cursor-pointer outline-none"
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Masuk button */}
            <Link
              href="/login"
              className="flex items-center justify-center h-9 px-5 rounded-full bg-linear-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity shrink-0 leading-none"
            >
              Masuk
            </Link>
          </Box>
        </Box>
      </Box>

      {/* ── Bottom tier – nav links ── */}
      <Box className="w-full border-b border-white/6">
        <Box className="max-w-6xl mx-auto px-4 md:px-8 h-11 flex items-center gap-7 overflow-x-auto no-scrollbar">
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-xs md:text-[13px] whitespace-nowrap tracking-wide transition-colors ${
                index === 0 ? "text-blue-400" : "text-white/45 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
