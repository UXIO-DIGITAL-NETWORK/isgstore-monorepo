import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, RefreshCw, Info } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/member-dashboard/components/integrasi/SectionCard";
import { Spinner } from "@/components/common/Spinner";

interface ApiKeyCardProps {
  apiKey: string;
  isKeyVisible: boolean;
  onToggleVisibility: () => void;
  onRegenerate: () => void;
  loading: boolean;
}

export default function ApiKeyCard({
  apiKey,
  isKeyVisible,
  onToggleVisibility,
  onRegenerate,
  loading,
}: ApiKeyCardProps): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  const maskedKey = "•".repeat(Math.min(apiKey.length, 60));

  return (
    <SectionCard title={t("integrasi.apiKey.title")}>
      <Box className="flex flex-col gap-3">
        {/* Input row: masked key field + Dokumentasi button */}
        <Box className="flex items-center gap-3">
          {/* Read-only key input with icon controls */}
          <Box className="relative flex-1 min-w-0">
            <Box
              as="input"
              type="text"
              value={isKeyVisible ? apiKey : maskedKey}
              readOnly
              aria-label={t("integrasi.apiKey.title")}
              className="w-full bg-[#0A0D14] border border-white/10 rounded-full px-4 py-2.5 text-white font-plex text-sm outline-none pr-20 truncate focus:border-[#3B82F6]/60 transition-all"
            />
            {/* Eye toggle */}
            <Box
              as="button"
              type="button"
              onClick={onToggleVisibility}
              aria-label={isKeyVisible ? t("integrasi.apiKey.hideLabel") : t("integrasi.apiKey.showLabel")}
              className="absolute right-10 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              {isKeyVisible ? (
                <EyeOff className="w-[18px] h-[18px]" />
              ) : (
                <Eye className="w-[18px] h-[18px]" />
              )}
            </Box>
            {/* Regenerate */}
            <Box
              as="button"
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              aria-label={t("integrasi.apiKey.regenerateLabel")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors cursor-pointer bg-transparent border-none p-0 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Spinner className="w-[16px] h-[16px]" /> : <RefreshCw className="w-[16px] h-[16px]" />}
            </Box>
          </Box>

          {/* Dokumentasi button — no-op placeholder */}
          {/* TODO: wire to actual API documentation URL when available */}
          <Box
            as="button"
            type="button"
            className="shrink-0 px-5 py-2.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] shadow-cta-primary font-outfit font-bold text-white text-[13px] hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
          >
            {t("integrasi.apiKey.docButton")}
          </Box>
        </Box>

        {/* Security notice */}
        <Box className="flex items-start gap-2.5 p-3 rounded-xl bg-[#9234EA]/8 border border-[#9234EA]/20">
          <Info className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
          <Text as="span" className="font-inter text-[12px] text-white/60 leading-relaxed">
            {t("integrasi.apiKey.notice")}
          </Text>
        </Box>
      </Box>
    </SectionCard>
  );
}
