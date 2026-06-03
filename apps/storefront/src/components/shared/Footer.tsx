import React from "react";
import {
  Gamepad2,
  ChevronRight,
  Clock,
  Mail,
  ShieldCheck,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
} from "lucide-react";
import whatsappLogo from "@/assets/icons/whatsapp_logo.svg";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";

import paymentLogo1 from "@/assets/images/payment_method/payment_logo_1.png";
import paymentLogo2 from "@/assets/images/payment_method/payment_logo_2.png";
import paymentLogo3 from "@/assets/images/payment_method/payment_logo_3.png";
import paymentLogo4 from "@/assets/images/payment_method/payment_logo_4.png";
import paymentLogo5 from "@/assets/images/payment_method/payment_logo_5.png";

const PAYMENT_LOGOS: { src: string; alt: string }[] = [
  { src: paymentLogo1, alt: "GoPay" },
  { src: paymentLogo2, alt: "DANA" },
  { src: paymentLogo3, alt: "OVO" },
  { src: paymentLogo4, alt: "QRIS" },
  { src: paymentLogo5, alt: "ShopeePay" },
];

const MENU_LINKS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "#" },
  { label: "Daftar Harga", href: "#" },
  { label: "Leaderboard", href: "#" },
  { label: "Berita", href: "#" },
  { label: "Kalkulator", href: "#" },
];

const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Kebijakan Pengembalian", href: "#" },
  { label: "Kebijakan Privasi", href: "#" },
  { label: "Syarat & Ketentuan", href: "#" },
];

type SocialIconEntry = { Icon: React.ElementType; label: string };
const SOCIAL_ICONS: SocialIconEntry[] = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: Youtube, label: "YouTube" },
  { Icon: Twitter, label: "X (Twitter)" },
  { Icon: Facebook, label: "Facebook" },
  { Icon: Linkedin, label: "LinkedIn" },
];

export function Footer(): React.JSX.Element {
  return (
    <Box as="footer" className="w-full bg-gradient-footer">

      {/* ── Top content — 3 col × 2 row grid ── */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 pt-14 pb-12">
        <Box className="grid grid-cols-1 gap-y-10 lg:grid-cols-[1.4fr_1fr_1.3fr] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-10">

          {/* ── ROW 1 ── */}

          {/* R1C1 — Brand */}
          <Box className="flex flex-col gap-5">
            {/* Logo mark */}
            <Box className="flex items-center gap-2.5">
              <Box className="w-10 h-10 rounded-full bg-linear-to-br from-[#3B82F6] to-[#9234EA] flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5 text-white" />
              </Box>
              <Text
                as="span"
                className="text-[22px] font-black text-white uppercase tracking-tight leading-none font-outfit"
              >
                TOPUP
                <Text as="span" className="text-[#9234EA] text-[22px] font-outfit font-black">
                  GAME
                </Text>
              </Text>
            </Box>

            {/* Description */}
            <Text
              as="p"
              className="text-[13.5px] leading-[1.75] text-white/50 font-inter max-w-85"
            >
              Platform top up game yang menyediakan layanan cepat, aman, dan praktis untuk
              berbagai kebutuhan digital Anda. Didukung sistem otomatis dan metode pembayaran
              lengkap, kami hadir untuk memberikan pengalaman transaksi yang lebih mudah dan
              terpercaya. Layanan top up game cepat, aman.
            </Text>
          </Box>

          {/* R1C2 — Support */}
          <Box className="flex flex-col gap-5">
            <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
              Butuh Bantuan?
            </Text>

            {/* WhatsApp CTA */}
            <Box
              as="button"
              type="button"
              className={cn(
                "flex items-center justify-between gap-2.5 w-full rounded-full",
                "bg-white/6 border border-white/15 backdrop-blur-sm",
                "pl-4 pr-4 py-2 cursor-pointer hover:bg-white/10 transition-colors",
              )}
            >
              <Box className="flex items-center gap-2.5">
                <img
                  src={whatsappLogo}
                  alt="WhatsApp"
                  className="w-6 h-6 shrink-0"
                />
                <Text
                  as="span"
                  className="text-[14px] font-semibold text-white font-outfit leading-none"
                >
                  Chat WhatsApp
                </Text>
              </Box>
              <ChevronRight className="w-4 h-4 text-white/45 shrink-0" />
            </Box>

            {/* Operational info */}
            <Box className="flex flex-col gap-3">
              <Box className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-white shrink-0" />
                <Text as="span" className="text-[13px] text-white/65 font-inter leading-none">
                  Jam Operasional: 24 Jam
                </Text>
              </Box>
              <Box className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <Text as="span" className="text-[13px] text-white/65 font-inter leading-none">
                  E-mail: support@topupgaming.com
                </Text>
              </Box>
            </Box>
          </Box>

          {/* R1C3 — Menu Link + Legalitas side by side */}
          <Box className="flex flex-row gap-10">
            {/* Menu Link */}
            <Box className="flex flex-col gap-5">
              <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
                Menu Link
              </Text>
              <Box className="flex flex-col gap-3.5">
                {MENU_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[13.5px] text-white/50 hover:text-white/80 font-inter transition-colors whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Legalitas */}
            <Box className="flex flex-col gap-5">
              <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
                Legalitas
              </Text>
              <Box className="flex flex-col gap-3.5">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[13.5px] text-white/50 hover:text-white/80 font-inter transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </Box>
            </Box>
          </Box>

          {/* ── ROW 2 ── */}

          {/* R2C1 — Payment methods */}
          <Box className="rounded-2xl border border-white/10 bg-white/4 backdrop-blur-sm p-5">
            <Text
              as="p"
              className="text-[13px] font-semibold text-white font-outfit mb-4 leading-none"
            >
              Metode Pembayaran
            </Text>
            <Box className="flex flex-row gap-2 overflow-x-auto no-scrollbar">
              {PAYMENT_LOGOS.map((logo) => (
                <Box
                  key={logo.alt}
                  className="h-8.25 w-16 bg-white rounded-md flex items-center justify-center overflow-hidden px-1.5 shrink-0"
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className="w-full h-full object-contain"
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/* R2C2 — Transaction guarantee */}
          <Box className="flex items-center gap-3.5">
            <Box className="w-14 h-14 rounded-xl bg-[#0EA42E]/18 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#0EA42E]" />
            </Box>
            <Box className="flex flex-col gap-1">
              <Text as="span" className="text-[11px] text-white/45 font-inter leading-none">
                Jaminan Transaksi
              </Text>
              <Text
                as="span"
                className="text-[15px] font-bold text-white font-outfit leading-snug"
              >
                100% Legal &amp; Aman
              </Text>
            </Box>
          </Box>

          {/* R2C3 — Social media */}
          <Box className="flex flex-col gap-3">
            <Text as="p" className="text-[14px] font-semibold text-white font-outfit">
              Follow Kami:
            </Text>
            <Box className="flex items-center gap-2 flex-wrap">
              {SOCIAL_ICONS.map(({ Icon, label }) => (
                <Box
                  key={label}
                  as="button"
                  type="button"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
                >
                  <Icon className="w-4.5 h-4.5 text-white" />
                </Box>
              ))}
            </Box>
          </Box>

        </Box>
      </Box>

      {/* ── Divider ── */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        <Box className="w-full h-px bg-white/10" />
      </Box>

      {/* ── Copyright bar ── */}
      <Box className="max-w-6xl mx-auto px-4 md:px-8 py-5">
        <Box className="flex items-center justify-between gap-4 flex-wrap">
          <Text as="span" className="text-[12px] text-white/30 font-inter">
            © 2026 Topup Game. All Rights Reserved. All trademarks,
          </Text>
          <Text as="span" className="text-[12px] text-white/30 font-inter">
            logos and brand names are the property of their respective owners.
          </Text>
        </Box>
      </Box>

    </Box>
  );
}
