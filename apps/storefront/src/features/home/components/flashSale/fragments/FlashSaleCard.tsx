import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { FlashSaleItem } from "@/features/home/types/flashSale.type";

function formatPrice(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

type Props = {
  item: FlashSaleItem;
  isActive: boolean;
};

export default function FlashSaleCard({ item, isActive }: Props): React.JSX.Element {
  const stockPercent = Math.round((item.stockAvailable / item.stockTotal) * 100);

  return (
    <Box
      className={`shrink-0 w-[195px] rounded-xl border p-4 flex flex-col gap-2.5 ${
        isActive ? "border-violet-500/70 bg-[#13111F]" : "border-white/8 bg-[#13111F]"
      }`}
      style={isActive ? { boxShadow: "0 0 0 1px rgba(139,92,246,0.2), 0 0 28px rgba(139,92,246,0.12)" } : undefined}
    >
      <Box className="flex justify-center pt-1">
        <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" loading="lazy" />
      </Box>

      <Box className="text-center">
        <Text as="p" className="text-sm font-bold text-white leading-snug">
          {item.name}
        </Text>
        <Text as="p" className="text-xs text-white/40 mt-0.5 leading-none">
          {item.game}
        </Text>
      </Box>

      <Text as="p" className="text-[17px] font-black text-white text-center leading-tight tabular-nums">
        {formatPrice(item.salePrice)}
      </Text>

      <Box className="flex items-center justify-between gap-1.5">
        <Text as="span" className="text-[11px] text-white/35 line-through tabular-nums">
          {formatPrice(item.originalPrice)}
        </Text>
        <Box className="rounded-full px-2 py-0.5 bg-green-600 border border-green-700 shrink-0 inline-flex justify-center items-center">
          <Text as="span" className="text-[10px] font-semibold text-white whitespace-nowrap tabular-nums">
            - {formatPrice(item.discount)}
          </Text>
        </Box>
      </Box>

      <Box>
        <Box className="flex items-center justify-between mb-1.5">
          <Text as="span" className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
            Tersedia
          </Text>
          <Text as="span" className="text-[10px] text-white/35 tabular-nums">
            {item.stockAvailable} / {item.stockTotal}
          </Text>
        </Box>
        <Box className="h-[3px] rounded-full bg-white/8">
          <Box
            className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500"
            style={{ width: `${stockPercent}%` }}
          />
        </Box>
      </Box>

      <Box
        as="button"
        type="button"
        className={`w-full h-10 rounded-full text-sm font-semibold transition-all cursor-pointer outline-none active:scale-95 mt-0.5 ${
          isActive
            ? "bg-linear-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"
            : "bg-white/6 border border-white/10 text-white/55 hover:bg-white/10 hover:text-white"
        }`}
      >
        Top Up Sekarang
      </Box>
    </Box>
  );
}
