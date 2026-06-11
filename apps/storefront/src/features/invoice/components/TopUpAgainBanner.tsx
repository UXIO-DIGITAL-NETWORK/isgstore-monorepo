import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";
import bgCtaCheckout from "@/assets/images/checkout/bg_cta_checkout.png";

export default function TopUpAgainBanner(): React.JSX.Element {
  const { t } = useTranslation("invoice");
  const { locale } = useParams({ strict: false }) as { locale: string };
  const navigate = useNavigate();

  const handleTopUpAgain = () => {
    void navigate({ to: "/$locale", params: { locale } });
  };

  const handleBackToHome = () => {
    void navigate({ to: "/$locale", params: { locale } });
  };

  return (
    <Box
      className="relative rounded-2xl overflow-hidden border border-[rgba(147,51,234,0.35)]"
      style={{ backgroundImage: `url(${bgCtaCheckout})`, backgroundSize: "fill", backgroundPosition: "center" }}
    >
      {/* Dark overlay for text legibility */}
      <Box className="absolute inset-0 bg-[#0A0A0C]/60" />

      {/* Content */}
      <Box className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-6 md:px-10 py-8 md:py-10">
        {/* Left: heading + subtitle */}
        <Box className="flex flex-col gap-2">
          <Text
            as="p"
            className="font-outfit font-bold text-[22px] md:text-[28px] text-white uppercase leading-tight"
          >
            {t("success.banner.title")}
          </Text>
          <Text
            as="p"
            className="font-inter text-[13px] md:text-[14px] text-white/65 leading-snug"
          >
            {t("success.banner.subtitle")}
          </Text>
        </Box>

        {/* Right: action buttons */}
        <Box className="flex items-center gap-3 shrink-0">
          <Button
            onClick={handleTopUpAgain}
            className="text-[13px] py-2.5 px-6 whitespace-nowrap"
          >
            {t("success.banner.topUpAgain")}
          </Button>
          <Box
            as="button"
            type="button"
            onClick={handleBackToHome}
            className="rounded-[50px] border border-white/20 bg-white/8 font-outfit font-bold text-[13px] text-white py-2.5 px-6 cursor-pointer hover:bg-white/15 transition-colors whitespace-nowrap"
          >
            {t("success.banner.backToHome")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
