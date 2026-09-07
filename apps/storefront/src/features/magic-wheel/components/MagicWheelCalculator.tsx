import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Info, ShoppingCart } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import MagicWheelResult from "@/features/magic-wheel/components/MagicWheelResult";
import { MAGIC_WHEEL_CALC_CONSTANTS } from "@/features/magic-wheel/types/magicWheel.type";

const { SLIDER_MIN, SLIDER_MAX } = MAGIC_WHEEL_CALC_CONSTANTS;

interface MagicWheelCalculatorProps {
  magicPoints: number;
  setMagicPoints: (value: number) => void;
  diamonds: number;
}

export default function MagicWheelCalculator({
  magicPoints,
  setMagicPoints,
  diamonds,
}: MagicWheelCalculatorProps): React.JSX.Element {
  const { t } = useTranslation("magicWheel");
  const { locale = "id" } = useParams({ strict: false }) as {
    locale?: string;
  };

  const fillPercent =
    ((magicPoints - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
  const trackStyle = {
    background: `linear-gradient(to right, #9333EA ${fillPercent}%, #1e1a2e ${fillPercent}%)`,
  };

  return (
    <Box className="rounded-2xl border border-white/10 bg-[rgba(59,130,246,0.05)] backdrop-blur-[6px] p-6 md:p-8 flex flex-col gap-5">
      {/* Slider header row */}
      <Box className="flex items-start justify-between gap-3">
        <Box className="flex flex-col gap-0.5">
          <Text
            as="span"
            className="font-outfit font-bold text-[13px] text-white tracking-wider"
          >
            {t("slider.label")}
          </Text>
          <Text
            as="span"
            className="font-inter text-[12px] text-white/45"
          >
            {t("slider.description")}
          </Text>
        </Box>
        <Text
          as="span"
          className="font-plex font-bold text-[28px] text-[#9234EA] leading-none shrink-0"
        >
          {magicPoints}
        </Text>
      </Box>

      {/* Slider */}
      <Box className="flex flex-col gap-1.5">
        <Box className="relative">
          <input
            type="range"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            value={magicPoints}
            onChange={(e) => setMagicPoints(Number(e.target.value))}
            style={trackStyle}
            className={[
              "w-full h-2 rounded-full appearance-none cursor-pointer outline-none",
              // Webkit thumb
              "[&::-webkit-slider-thumb]:appearance-none",
              "[&::-webkit-slider-thumb]:w-5",
              "[&::-webkit-slider-thumb]:h-5",
              "[&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-white",
              "[&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(147,51,234,0.6)]",
              "[&::-webkit-slider-thumb]:border-2",
              "[&::-webkit-slider-thumb]:border-[#9333EA]",
              "[&::-webkit-slider-thumb]:cursor-pointer",
              // Firefox thumb
              "[&::-moz-range-thumb]:w-5",
              "[&::-moz-range-thumb]:h-5",
              "[&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-white",
              "[&::-moz-range-thumb]:border-2",
              "[&::-moz-range-thumb]:border-[#9333EA]",
              "[&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:shadow-[0_0_6px_rgba(147,51,234,0.6)]",
            ].join(" ")}
          />
        </Box>
        {/* Min / max labels */}
        <Box className="flex items-center justify-between">
          <Text as="span" className="font-inter text-[12px] text-white/40">
            {SLIDER_MIN}
          </Text>
          <Text as="span" className="font-inter text-[12px] text-white/40">
            {SLIDER_MAX}
          </Text>
        </Box>
      </Box>

      {/* Catatan note */}
      <Box className="flex items-start gap-2.5 rounded-xl border border-[#9333EA]/20 bg-[#9333EA]/10 px-4 py-3">
        <Info size={15} className="text-[#9333EA] shrink-0 mt-0.5" />
        <Box className="flex flex-col gap-0.5">
          <Text
            as="span"
            className="font-inter font-semibold text-[12px] text-[#9333EA]"
          >
            {t("note.title")}
          </Text>
          <Text as="span" className="font-inter text-[12px] text-white/55">
            {t("note.description")}
          </Text>
        </Box>
      </Box>

      {/* Result box */}
      <MagicWheelResult diamonds={diamonds} />

      {/* CTA */}
      <Link
        href={`/${locale}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] font-outfit font-bold text-[15px] text-white shadow-cta-primary hover:opacity-90 active:opacity-80 transition-opacity text-center"
      >
        <ShoppingCart size={16} />
        {t("cta")}
      </Link>
    </Box>
  );
}
