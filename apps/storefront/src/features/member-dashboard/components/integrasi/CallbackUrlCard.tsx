import React from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/integrasi/SectionCard";

interface CallbackUrlCardProps {
  callbackUrl: string;
  onChangeUrl: (url: string) => void;
  onSubmit: () => void;
}

export default function CallbackUrlCard({
  callbackUrl,
  onChangeUrl,
  onSubmit,
}: CallbackUrlCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <SectionCard title={t("integrasi.callback.title")}>
      <Box className="flex flex-col gap-3">
        {/* Input + submit row */}
        <Box className="flex items-center gap-3">
          <Box
            as="input"
            type="url"
            value={callbackUrl}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChangeUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("integrasi.callback.placeholder")}
            className="flex-1 min-w-0 bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[#3B82F6]/60 transition-all"
          />
          <Box
            as="button"
            type="button"
            onClick={onSubmit}
            className="shrink-0 px-6 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
          >
            {t("integrasi.callback.submitButton")}
          </Box>
        </Box>

        {/* Info notice */}
        <Box className="flex items-start gap-2.5 p-3 rounded-xl bg-[#3B82F6]/8 border border-[#3B82F6]/20">
          <Info className="w-4 h-4 text-[#3B82F6] shrink-0 mt-0.5" />
          <Text as="span" className="font-inter text-[12px] text-white/60 leading-relaxed">
            {t("integrasi.callback.notice")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}
