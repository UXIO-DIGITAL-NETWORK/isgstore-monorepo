import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import bgCtaCheckout from "@/assets/images/checkout/bg_cta_checkout.png";
import whatsappLogo from "@/assets/icons/whatsapp_logo.svg";

export default function FaqContactBanner(): React.JSX.Element {
  const { t } = useTranslation("faq");

  return (
    <Box
      className="relative rounded-2xl overflow-hidden border border-[rgba(147,51,234,0.35)]"
      style={{
        backgroundImage: `url(${bgCtaCheckout})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <Box className="absolute inset-0 bg-[#0A0A0C]/60" />

      {/* Content */}
      <Box className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10">
        {/* Left: heading + subtitle */}
        <Box className="flex flex-col gap-2">
          <Text
            as="p"
            className="font-outfit font-bold text-[22px] md:text-[28px] text-white uppercase leading-tight"
          >
            {t("contact.title")}
          </Text>
          <Text
            as="p"
            className="font-inter text-[13px] md:text-[14px] text-white/65 leading-snug"
          >
            {t("contact.subtitle")}
          </Text>
        </Box>

        {/* Right: WhatsApp button */}
        <Box
          as="button"
          type="button"
          className="flex items-center justify-between gap-2.5 rounded-full bg-white/6 border border-white/15 backdrop-blur-sm pl-4 pr-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors shrink-0"
        >
          <Box className="flex items-center gap-2.5">
            <img src={whatsappLogo} alt="WhatsApp" className="w-6 h-6 shrink-0" />
            <Text
              as="span"
              className="font-outfit font-semibold text-[14px] text-white leading-none whitespace-nowrap"
            >
              {t("contact.chatWhatsApp")}
            </Text>
          </Box>
          <ChevronRight className="w-4 h-4 text-white/45 shrink-0 ml-1" />
        </Box>
      </Box>
    </Box>
  );
}
