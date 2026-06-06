import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/Input";
import SectionCard from "@/features/checkout/components/SectionCard";

interface Props {
  whatsapp: string;
  onWhatsappChange: (val: string) => void;
}

export default function ContactDetail({ whatsapp, onWhatsappChange }: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <SectionCard stepNumber={4} title={t("contact.title")} gradientBorder>
      <Box className="flex flex-col gap-3">
        {/* WhatsApp field */}
        <Box className="flex flex-col gap-1.5">
          <Text as="span" className="font-inter font-medium text-[13px] text-[#C9D5E3] leading-none">
            {t("contact.whatsapp")}
          </Text>
          <Box className="relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              <Text as="span" className="font-inter font-medium text-[13px] text-white/70 leading-none">
                +62
              </Text>
              <Text as="span" className="text-white/20 text-sm leading-none">|</Text>
            </Box>
            <Input
              type="tel"
              value={whatsapp}
              onChange={(e) => onWhatsappChange(e.target.value)}
              placeholder={t("contact.whatsappPlaceholder")}
              className="pl-[52px]"
            />
          </Box>
          {/* Inline helper note */}
          <Text as="span" className="font-inter text-[11px] text-white/40 leading-none px-1">
            **{t("contact.helperNote")}
          </Text>
        </Box>

        {/* Receipt info box */}
        <Box className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#9333EA]/50 bg-[#9333EA]/10">
          <Text as="span" className="text-[#C084FC] text-[14px] leading-none shrink-0">ⓘ</Text>
          <Text as="span" className="font-inter text-[12px] text-[#C084FC] leading-relaxed">
            {t("contact.receiptNote")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}
