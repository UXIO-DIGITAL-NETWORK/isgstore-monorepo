import React from "react";
import { cva } from "class-variance-authority";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { PriceText } from "@/components/common/PriceText";
import { formatCurrency } from "@/lib/format";
import type { FlashSaleItem } from "@/features/home/types/flashSale.type";

const cardVariants = cva(
  "shrink-0 w-[195px] rounded-xl border p-4 flex flex-col gap-2.5",
  {
    variants: {
      active: {
        true: "border-[3px] border-[#C084FC] bg-[#13111F]",
        false: "border border-white/8 bg-[#13111F]",
      },
    },
    defaultVariants: { active: false },
  },
);

const buttonVariants = cva(
  "w-full h-10 rounded-full text-sm font-semibold transition-all cursor-pointer outline-none active:scale-95 mt-0.5",
  {
    variants: {
      active: {
        true: "bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-white hover:opacity-90",
        false: "bg-white/6 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white",
      },
    },
    defaultVariants: { active: false },
  },
);

type Props = {
  item: FlashSaleItem;
  isActive: boolean;
};

export default function FlashSaleCard({ item, isActive }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("home");
  const locale = i18n.language;
  const stockPercent = Math.round((item.stockAvailable / item.stockTotal) * 100);

  return (
    <Box
      className={cardVariants({ active: isActive })}
      style={isActive ? { boxShadow: "0 0 0 1px rgba(192,132,252,0.15), 0 0 28px rgba(147,51,234,0.15)" } : undefined}
    >
      <Box className="flex justify-center pt-1">
        <Image src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" loading="lazy" />
      </Box>

      <Box className="text-center">
        <Text as="p" className="text-sm font-bold text-white leading-snug font-dmsans">
          {item.name}
        </Text>
        <Text as="p" className="text-xs text-white/40 mt-0.5 leading-none">
          {item.game}
        </Text>
      </Box>

      <PriceText className="text-center">
        {formatCurrency(item.salePrice, locale)}
      </PriceText>

      <Box className="flex items-center justify-between gap-1.5">
        <Text as="span" className="text-[11px] text-white/35 line-through tabular-nums font-plex">
          {formatCurrency(item.originalPrice, locale)}
        </Text>
        <Box className="rounded-[10px] px-2 py-0.5 bg-[#0EA42E] shrink-0 inline-flex justify-center items-center">
          <Text as="span" className="text-[10px] font-semibold text-white whitespace-nowrap tabular-nums font-plex">
            - {formatCurrency(item.discount, locale)}
          </Text>
        </Box>
      </Box>

      <Box>
        <Box className="flex items-center justify-between mb-1.5">
          <Text as="span" className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
            {t("flashSale.available")}
          </Text>
          <Text as="span" className="text-[10px] text-white/35 tabular-nums font-plex">
            {item.stockAvailable} / {item.stockTotal}
          </Text>
        </Box>
        <Box className="h-0.75 rounded-full bg-[#0B051D]">
          <Box
            className="h-full rounded-full bg-[#9333EA]"
            style={{ width: `${stockPercent}%` }}
          />
        </Box>
      </Box>

      <Box
        as="button"
        type="button"
        className={buttonVariants({ active: isActive })}
      >
        {t("flashSale.topUpNow")}
      </Box>
    </Box>
  );
}
