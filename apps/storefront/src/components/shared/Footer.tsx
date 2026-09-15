import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock,
  Mail,
  ShieldCheck,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin,
  Music2,
} from "lucide-react";
import whatsappLogo from "@/assets/icons/whatsapp_logo.svg";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { SiteLogo } from "@/components/shared/SiteLogo";
import { useSiteSettings, whatsappLink } from "@/hooks/useSiteSettings";
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

/**
 * The networks the footer can show, each paired with the setting that holds its
 * URL. Only the ones an admin has filled in are rendered — an icon that links
 * nowhere is worse than an absent one, which is what the previous hardcoded
 * list produced for every network the business does not actually use.
 */
type SocialIconEntry = { Icon: React.ElementType; label: string; settingKey: string };
const SOCIAL_ICONS: SocialIconEntry[] = [
  { Icon: Instagram, label: "Instagram", settingKey: "social_instagram" },
  { Icon: Music2, label: "TikTok", settingKey: "social_tiktok" },
  { Icon: Youtube, label: "YouTube", settingKey: "social_youtube" },
  { Icon: Facebook, label: "Facebook", settingKey: "social_facebook" },
  { Icon: Twitter, label: "X (Twitter)", settingKey: "social_x" },
  { Icon: Linkedin, label: "LinkedIn", settingKey: "social_linkedin" },
];

export function Footer(): React.JSX.Element {
  const { t } = useTranslation("common");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const { text } = useSiteSettings();

  // Every value below falls back to the bundled copy: a setting an admin has
  // not filled in must not blank out the footer.
  const whatsappHref = whatsappLink(text("contact_whatsapp"));
  const supportEmail = text("contact_email");
  const operationalHours = text("operational_hours");
  const socialLinks = SOCIAL_ICONS.map((entry) => ({ ...entry, href: text(entry.settingKey) })).filter(
    (entry): entry is SocialIconEntry & { href: string } => Boolean(entry.href),
  );

  const MENU_LINKS: { labelKey: string; href: string }[] = [
    { labelKey: "footer.menu.dashboard", href: `/${locale}/dashboard` },
    { labelKey: "footer.menu.priceList", href: `/${locale}/daftar-harga` },
    { labelKey: "footer.menu.leaderboard", href: `/${locale}/leaderboard` },
    { labelKey: "footer.menu.news", href: `/${locale}/berita` },
    { labelKey: "footer.menu.calculator", href: `/${locale}/kalkulator-win-rate` },
    { labelKey: "footer.menu.faq", href: `/${locale}/faq` },
  ];

  const LEGAL_LINKS: { labelKey: string; href: string }[] = [
    { labelKey: "footer.legal.refundPolicy", href: `/${locale}/refund` },
    { labelKey: "footer.legal.privacyPolicy", href: `/${locale}/kebijakan-privasi` },
    // The CMS page slug the API seeds, reached through the generic page route.
    // It used to be "#", so the link the policy pages themselves reference went
    // nowhere.
    { labelKey: "footer.legal.termsConditions", href: `/${locale}/halaman/syarat-ketentuan` },
  ];

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
              <SiteLogo className="w-10 h-10" />
            </Box>

            {/* Description */}
            <Text
              as="p"
              className="text-[13.5px] leading-[1.75] text-white/50 font-inter max-w-85"
            >
              {text("footer_description") ?? t("footer.description")}
            </Text>
          </Box>

          {/* R1C2 — Support */}
          <Box className="flex flex-col gap-5">
            <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
              {t("footer.needHelp")}
            </Text>

            {/* WhatsApp CTA */}
            {/* Rendered only when a number is configured: the button was
                previously inert, so a customer who clicked it got nothing. */}
            {whatsappHref && (
            <Link
              href={whatsappHref}
              target="_blank"
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
                  {t("footer.chatWhatsApp")}
                </Text>
              </Box>
              <ChevronRight className="w-4 h-4 text-white/45 shrink-0" />
            </Link>
            )}

            {/* Operational info */}
            <Box className="flex flex-col gap-3">
              {operationalHours && (
                <Box className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-white shrink-0" />
                  <Text as="span" className="text-[13px] text-white/65 font-inter leading-none">
                    {t("footer.operationalHoursLabel")}: {operationalHours}
                  </Text>
                </Box>
              )}
              {supportEmail && (
                <Box className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-white shrink-0" />
                  <Link
                    href={`mailto:${supportEmail}`}
                    className="text-[13px] text-white/65 hover:text-white font-inter leading-none transition-colors"
                  >
                    {t("footer.emailLabel")}: {supportEmail}
                  </Link>
                </Box>
              )}
            </Box>
          </Box>

          {/* R1C3 — Menu Link + Legalitas side by side */}
          <Box className="flex flex-row gap-10">
            {/* Menu Link */}
            <Box className="flex flex-col gap-5">
              <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
                {t("footer.menuLink")}
              </Text>
              <Box className="flex flex-col gap-3.5">
                {MENU_LINKS.map((link) => (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    className="text-[13.5px] text-white/50 hover:text-white/80 font-inter transition-colors whitespace-nowrap"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* Legalitas */}
            <Box className="flex flex-col gap-5">
              <Text as="p" className="text-[17px] font-bold text-white font-outfit leading-none">
                {t("footer.legalitas")}
              </Text>
              <Box className="flex flex-col gap-3.5">
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    className="text-[13.5px] text-white/50 hover:text-white/80 font-inter transition-colors"
                  >
                    {t(link.labelKey)}
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
              {t("footer.paymentMethods")}
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
                {t("footer.transactionGuarantee")}
              </Text>
              <Text
                as="span"
                className="text-[15px] font-bold text-white font-outfit leading-snug"
              >
                {t("footer.transactionGuaranteeValue")}
              </Text>
            </Box>
          </Box>

          {/* R2C3 — Social media */}
          {socialLinks.length > 0 && (
            <Box className="flex flex-col gap-3">
              <Text as="p" className="text-[14px] font-semibold text-white font-outfit">
                {t("footer.followUs")}
              </Text>
              <Box className="flex items-center gap-2 flex-wrap">
                {socialLinks.map(({ Icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    target="_blank"
                    aria-label={label}
                    className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <Icon className="w-4.5 h-4.5 text-white" />
                  </Link>
                ))}
              </Box>
            </Box>
          )}

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
            {text("copyright_text") ?? t("footer.copyright")}
          </Text>
          {/* The trademark notice is boilerplate, not branding, so it stays in
              the locale files — and is dropped when an admin has written their
              own copyright line, which supersedes the pair. */}
          {!text("copyright_text") && (
            <Text as="span" className="text-[12px] text-white/30 font-inter">
              {t("footer.copyrightOwners")}
            </Text>
          )}
        </Box>
      </Box>

    </Box>
  );
}
