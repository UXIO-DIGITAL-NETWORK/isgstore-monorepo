import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";
import whatsappLogo from "@/assets/icons/whatsapp_logo.svg";

interface Props {
  whatsapp: string;
  onWhatsappChange: (val: string) => void;
}

export default function ContactDetail({ whatsapp, onWhatsappChange }: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <SectionCard stepNumber={4} title={t("contact.title")}>
      <Box className="flex flex-col gap-4">
        {/* WhatsApp */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
            {t("contact.whatsapp")}
            <Text as="span" className="text-[#C084FC] ml-0.5">*</Text>
          </Text>
          <Box className="relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
              <img
                src={whatsappLogo}
                alt="WhatsApp"
                className="w-4 h-4"
              />
              <Text as="span" className="text-white/30 text-sm">|</Text>
            </Box>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder={t("contact.whatsappPlaceholder")}
              className="pl-10"
            />
          </Box>
        </Box>

        {/* Email (optional) */}
        <Box className="flex flex-col gap-1.5">
          <Box className="flex items-center gap-2">
            <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
              {t("contact.email")}
            </Text>
            <Box className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10">
              <Text as="span" className="font-outfit text-[9px] text-white/45 uppercase tracking-wide leading-none">
                {t("contact.optional")}
              </Text>
            </Box>
          </Box>
          <Input
            type="email"
            placeholder={t("contact.emailPlaceholder")}
          />
        </Box>

        {/* Helper */}
        <Box className="flex items-start gap-2">
          <Text as="span" className="text-[#C084FC] text-[12px] leading-none shrink-0 mt-0.5">ℹ</Text>
          <Text as="span" className="font-inter text-[11px] text-white/40 leading-relaxed">
            {t("contact.helper")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}
