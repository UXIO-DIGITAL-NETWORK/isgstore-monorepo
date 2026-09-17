import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DiamondPackage } from "@/features/checkout/types/checkout.type";

import iconDiamond from "@/assets/images/checkout/icon_diamond.png";
import iconPoint1 from "@/assets/images/checkout/icon_point_1.png";
import iconPoint2 from "@/assets/images/checkout/icon_point_2.png";
import iconPoint3 from "@/assets/images/checkout/icon_point_3.png";
import fastIcon from "@/assets/icons/fast.svg";

const BONUS_ICONS: Record<1 | 2 | 3, string> = {
  1: iconPoint1,
  2: iconPoint2,
  3: iconPoint3,
};

const cardVariants = cva(
  "relative flex flex-col text-left rounded-xl overflow-hidden border cursor-pointer select-none transition-all outline-none bg-[#0D1117]",
  {
    variants: {
      selected: {
        true: "border-[#C084FC]",
        false: "border-white/[0.08] hover:border-[#C084FC]/40",
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
  const bonusVariant = pkg.bonusVariant ?? 1;
  const bonusIcon = BONUS_ICONS[bonusVariant as 1 | 2 | 3];

  return (
    <Box
      as="button"
      type="button"
      // Sold out for today: still shown (the ladder should read completely, and
      // hiding a denomination makes the page look broken), but not selectable —
      // the API would refuse the order anyway.
      disabled={pkg.isSoldOut}
      aria-disabled={pkg.isSoldOut}
      onClick={() => !pkg.isSoldOut && onSelect(pkg.id)}
      className={cn(cardVariants({ selected: isSelected }), pkg.isSoldOut && "cursor-not-allowed opacity-55")}
      style={
        isSelected
          ? { boxShadow: "0 0 0 1px rgba(192,132,252,0.2), 0 0 16px rgba(147,51,234,0.15)" }
          : undefined
      }
    >
      {/* ── Top content ────────────────────────────────────────────────── */}
      <Box className="flex flex-col gap-2 px-3 pt-3 pb-2">
        {/* Package name */}
        <Box className="flex items-start justify-between gap-2">
          <Text
            as="span"
            className={cn(
              "font-dmsans text-[11px] leading-tight",
              isSelected ? "text-white" : "text-white/85",
            )}
          >
            {pkg.name}
          </Text>

          {pkg.isSoldOut && (
            <Text
              as="span"
              className="shrink-0 rounded-full bg-destructive/20 px-2 py-0.5 font-outfit text-[10px] font-medium leading-none text-destructive"
            >
              {t("packages.soldOut")}
            </Text>
          )}
        </Box>

        {/* Price row: diamond icon + price */}
        <Box className="flex items-center gap-2">
          <Box
            as="img"
            src={iconDiamond}
            alt="diamond"
            className="w-6 h-6 object-contain shrink-0"
          />
          <PriceText className="text-[16px] leading-none">
            {formatCurrency(pkg.price, locale)}
          </PriceText>
        </Box>
      </Box>

      {/* ── Bottom band ─────────────────────────────────────────────────── */}
      <Box className="flex items-center justify-between gap-2 px-3 py-2 mt-auto bg-[rgba(147,51,234,0.12)]">
        {/* Bonus chip */}
        {pkg.bonus !== undefined && (
          <Box className="flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5">
            <Box
              as="img"
              src={bonusIcon}
              alt="bonus"
              className="w-3.5 h-3.5 object-contain shrink-0"
            />
            <Text as="span" className="font-plex text-[11px] text-white/90 leading-none">
              +{pkg.bonus}
            </Text>
          </Box>
        )}

        {/* Instant delivery label */}
        <Box className="flex items-center gap-1 ml-auto">
          <Box
            as="img"
            src={fastIcon}
            alt="instant"
            className="w-4 h-4 object-contain shrink-0"
          />
          <Text
            as="span"
            className="font-inter text-[8px] leading-tight text-white/45 text-right whitespace-pre-line"
          >
            {t("packages.instantDelivery")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
