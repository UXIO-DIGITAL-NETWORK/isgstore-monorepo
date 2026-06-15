import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import StatusBadge from "@/features/price-list/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PriceListItem } from "@/features/price-list/types/priceList.type";

/**
 * Must match the grid template in PriceTable header.
 * Columns: Game | Layanan | Harga Normal | Member | Gold | Status
 */
export const TABLE_GRID_COLS =
  "grid-cols-[1.4fr_2.2fr_1.3fr_1.3fr_1.3fr_0.9fr]";

interface Props {
  item: PriceListItem;
  index: number;
}

export default function PriceTableRow({ item, index }: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const isEven = index % 2 === 0;

  return (
    <>
      {/* ── Desktop row (md+) ─────────────────────────────────────────── */}
      <Box
        className={cn(
          `hidden md:grid ${TABLE_GRID_COLS} items-center w-full px-5 py-3.5`,
          "border-b border-white/5 last:border-0",
          isEven ? "bg-transparent" : "bg-[#0D0718]/40",
        )}
      >
        {/* Game cell: logo + name + region */}
        <Box className="flex items-center gap-2 min-w-0">
          <img
            src={item.gameLogo}
            alt={item.gameName}
            className="w-7 h-7 rounded-md object-contain flex-shrink-0"
          />
          <Box className="flex flex-col gap-0.5 min-w-0">
            <Text
              as="span"
              className="font-dmsans font-bold text-[13px] text-white/85 leading-tight truncate"
            >
              {item.gameName}
            </Text>
            <Text as="span" className="font-inter text-[11px] text-white/40 leading-none truncate">
              {item.gameRegion}
            </Text>
          </Box>
        </Box>

        {/* Service name + ID sub-label */}
        <Box className="flex flex-col gap-0.5">
          <Text as="span" className="font-inter text-[13px] text-white leading-none">
            {item.serviceName}
          </Text>
          <Text as="span" className="font-plex text-[11px] text-white/40 leading-none">
            ID: {item.id}
          </Text>
        </Box>

        {/* Harga Normal */}
        <Text as="span" className="font-plex text-[13px] text-white/80 leading-none">
          {formatCurrency(item.normalPrice, locale)}
        </Text>

        {/* Member price (azure) */}
        <Text as="span" className="font-plex text-[13px] text-[#3B82F6] leading-none">
          {formatCurrency(item.memberPrice, locale)}
        </Text>

        {/* Gold price (amber) */}
        <Text as="span" className="font-plex text-[13px] text-[#E5A000] leading-none">
          {formatCurrency(item.goldPrice, locale)}
        </Text>

        {/* Status badge */}
        <Box className="flex justify-center">
          <StatusBadge status={item.status} />
        </Box>
      </Box>

      {/* ── Mobile card (< md) ────────────────────────────────────────── */}
      <Box
        className={cn(
          "md:hidden flex flex-col gap-2.5 w-full px-4 py-4",
          "border-b border-white/5 last:border-0",
          isEven ? "bg-transparent" : "bg-[#0D0718]/40",
        )}
      >
        {/* Game + Status row */}
        <Box className="flex items-center justify-between gap-2">
          <Box className="flex items-center gap-2 min-w-0">
            <img
              src={item.gameLogo}
              alt={item.gameName}
              className="w-6 h-6 rounded-md object-contain flex-shrink-0"
            />
            <Box className="flex flex-col gap-0.5 min-w-0">
              <Text as="span" className="font-dmsans font-bold text-[12px] text-purple-300/80 leading-none truncate">
                {item.gameName}
              </Text>
              <Text as="span" className="font-inter text-[10px] text-white/40 leading-none truncate">
                {item.gameRegion}
              </Text>
            </Box>
          </Box>
          <StatusBadge status={item.status} />
        </Box>

        {/* Service name */}
        <Box className="flex flex-col gap-0.5">
          <Text as="span" className="font-inter text-[13px] text-white leading-tight">
            {item.serviceName}
          </Text>
          <Text as="span" className="font-plex text-[11px] text-white/40 leading-none">
            ID: {item.id}
          </Text>
        </Box>

        {/* Prices row */}
        <Box className="flex items-center gap-4 flex-wrap">
          <Box className="flex flex-col gap-0.5">
            <Text as="span" className="font-inter text-[10px] text-white/40 leading-none uppercase tracking-wide">
              Normal
            </Text>
            <Text as="span" className="font-plex text-[13px] text-white/80 leading-none">
              {formatCurrency(item.normalPrice, locale)}
            </Text>
          </Box>
          <Box className="flex flex-col gap-0.5">
            <Text as="span" className="font-inter text-[10px] text-[#3B82F6]/70 leading-none uppercase tracking-wide">
              Member
            </Text>
            <Text as="span" className="font-plex text-[13px] text-[#3B82F6] leading-none">
              {formatCurrency(item.memberPrice, locale)}
            </Text>
          </Box>
          <Box className="flex flex-col gap-0.5">
            <Text as="span" className="font-inter text-[10px] text-[#E5A000]/70 leading-none uppercase tracking-wide">
              Gold
            </Text>
            <Text as="span" className="font-plex text-[13px] text-[#E5A000] leading-none">
              {formatCurrency(item.goldPrice, locale)}
            </Text>
          </Box>
        </Box>
      </Box>
    </>
  );
}
