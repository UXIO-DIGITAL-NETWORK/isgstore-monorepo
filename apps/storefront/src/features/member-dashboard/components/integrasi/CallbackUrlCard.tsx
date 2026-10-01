import React from "react";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/integrasi/SectionCard";
import { Spinner } from "@/components/common/Spinner";

interface CallbackUrlCardProps {
  callbackUrl: string;
  onChangeUrl: (url: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export default function CallbackUrlCard({
  callbackUrl,
  onChangeUrl,
  onSubmit,
  loading,
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
            className="flex-1 min-w-0 bg-[rgb(14,20,10)] border border-white/10 rounded-full px-4 py-2.5 text-white placeholder:text-white/30 text-sm font-inter outline-none focus:border-[rgb(67,86,32)]/60 transition-all"
          />
          <Box
            as="button"
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="shrink-0 flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading && <Spinner className="w-4 h-4" />}
            {t("integrasi.callback.submitButton")}
          </Box>
        </Box>

        {/* Info notice */}
        <Box className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgb(67,86,32)]/8 border border-[rgb(67,86,32)]/20">
          <Info className="w-4 h-4 text-[rgb(208,201,129)] shrink-0 mt-0.5" />
          <Text as="span" className="font-inter text-[12px] text-white/60 leading-relaxed">
            {t("integrasi.callback.notice")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}
