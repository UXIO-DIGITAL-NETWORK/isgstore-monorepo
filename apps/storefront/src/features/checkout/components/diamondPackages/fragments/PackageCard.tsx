import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiamondPackage } from "@/features/checkout/types/checkout.type";

const cardVariants = cva(
  "relative flex flex-col items-center gap-2 p-3 rounded-xl border cursor-pointer select-none transition-all outline-none",
  {
    variants: {
      selected: {
        true: "border-[2px] border-[#C084FC] bg-[rgba(192,132,252,0.08)]",
        false: "border border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.04)] hover:border-[rgba(192,132,252,0.4)] hover:bg-[rgba(147,51,234,0.06)]",
      },
    },
    defaultVariants: { selected: false },
  },
);

interface Props {
  pkg: DiamondPackage;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function PackageCard({ pkg, isSelected, onSelect }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("checkout");
  const locale = i18n.language;

  return (
    <Box
      as="button"
      type="button"
      onClick={() => onSelect(pkg.id)}
      className={cn(cardVariants({ selected: isSelected }))}
      style={
        isSelected
          ? { boxShadow: "0 0 0 1px rgba(192,132,252,0.2), 0 0 16px rgba(147,51,234,0.15)" }
          : undefined
      }
    >
      {/* Badges */}
      {pkg.isPopular && (
        <Box className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <Box className="px-2 py-0.5 rounded-full bg-[#9333EA] border border-[#C084FC]/30">
            <Text as="span" className="font-outfit font-bold text-[9px] uppercase tracking-[0.4px] text-white whitespace-nowrap">
              {t("packages.popular")}
            </Text>
          </Box>
        </Box>
      )}
      {pkg.isBonus && !pkg.isPopular && (
        <Box className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
          <Box className="px-2 py-0.5 rounded-full bg-[#0EA42E]">
            <Text as="span" className="font-outfit font-bold text-[9px] uppercase tracking-[0.4px] text-white whitespace-nowrap">
              {t("packages.bonus")}
            </Text>
          </Box>
        </Box>
      )}

      {/* Diamond icon */}
      <DiamondIcon selected={isSelected} />

      {/* Package name */}
      <Text
        as="span"
        className={cn(
          "font-dmsans font-bold text-[12px] leading-tight text-center",
          isSelected ? "text-white" : "text-white/80",
        )}
      >
        {pkg.name}
      </Text>

      {/* Price */}
      <PriceText className="text-[13px] leading-tight">
        {formatCurrency(pkg.price, locale)}
      </PriceText>
    </Box>
  );
}

function DiamondIcon({ selected }: { selected: boolean }): React.JSX.Element {
  return (
    <Box className="w-8 h-8 flex items-center justify-center">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`diamond-grad-${selected ? "s" : "d"}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={selected ? "#C084FC" : "#3B82F6"} />
            <stop offset="100%" stopColor={selected ? "#9234EA" : "#6B21A8"} />
          </linearGradient>
        </defs>
        <polygon
          points="14,2 26,10 14,26 2,10"
          fill={`url(#diamond-grad-${selected ? "s" : "d"})`}
          opacity={selected ? 1 : 0.85}
        />
        <polygon
          points="14,2 26,10 14,13"
          fill="white"
          opacity="0.15"
        />
      </svg>
    </Box>
  );
}
