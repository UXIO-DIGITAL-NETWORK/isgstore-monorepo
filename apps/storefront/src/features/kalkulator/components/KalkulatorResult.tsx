import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Target } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { WinRateResult } from "@/features/kalkulator/types/kalkulator.type";

interface KalkulatorResultProps {
  result: WinRateResult | null;
}

export default function KalkulatorResult({
  result,
}: KalkulatorResultProps): React.JSX.Element | null {
  const { t } = useTranslation("kalkulator");

  if (!result) return null;

  return (
    <Box className="rounded-2xl border border-[rgb(208,201,129)]/30 bg-[rgb(14,20,10)]/60 shadow-glow-accent p-6 md:p-8 flex flex-col items-center gap-5 text-center">
      {/* ── Section title ── */}
      <Text as="p" className="font-inter text-[14px] text-white/60 uppercase tracking-wider">
        {t("result.title")}
      </Text>

      {/* ── Win count or edge-case message ── */}
      {result.status === "normal" && (
        <>
          {/* Large gradient number */}
          <Box className="flex items-baseline gap-2">
            <Text
              as="span"
              className="font-plex font-bold text-[72px] md:text-[88px] leading-none bg-gradient-price bg-clip-text text-transparent"
            >
              {result.winsNeeded}
            </Text>
            <Text
              as="span"
              className="font-outfit font-semibold text-[22px] text-[rgb(208,201,129)]"
            >
              {t("result.matchSuffix")}
            </Text>
          </Box>

          {/* Description */}
          <Text as="p" className="font-inter text-[14px] text-white/70 leading-relaxed max-w-xs">
            <Trans
              i18nKey="result.description"
              ns="kalkulator"
              components={{ b: <strong className="text-white font-semibold" /> }}
            />
          </Text>
        </>
      )}

      {result.status === "reached" && (
        <Text as="p" className="font-inter text-[15px] text-[#0EA42E] font-semibold">
          {t("result.reached")}
        </Text>
      )}

      {result.status === "impossible" && (
        <Text as="p" className="font-inter text-[15px] text-red-400 font-semibold">
          {t("result.impossible")}
        </Text>
      )}

      {/* ── Target WR badge ── */}
      <Box className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
        <Box className="text-[rgb(208,201,129)]">
          <Target size={24} />
        </Box>
        <Box className="flex flex-col items-start">
          <Text as="span" className="font-inter text-[11px] text-white/50 uppercase tracking-wider">
            {t("result.targetWrLabel")}
          </Text>
          <Text
            as="span"
            className="font-plex font-bold text-[26px] text-white leading-tight"
          >
            {result.targetWR}%
          </Text>
        </Box>
      </Box>

      {/* ── Footer motivational text ── */}
      <Text as="p" className="font-inter text-[13px] text-white/40 italic">
        {t("result.footer")}
      </Text>
    </Box>
  );
}
