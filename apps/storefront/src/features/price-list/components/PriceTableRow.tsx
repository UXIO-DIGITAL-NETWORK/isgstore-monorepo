import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import StatusBadge from "@/features/price-list/components/StatusBadge";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { displayTiers, tierColor, tierPriceLabel } from "@/features/price-list/lib/tierColumns";
import type { PriceListItem } from "@/features/price-list/types/priceList.type";

interface Props {
  item: PriceListItem;
  index: number;
  /** Built by the parent from the plans the API returned; header and row must
   *  share one template or the columns drift apart. */
  gridTemplate: string;
}

export default function PriceTableRow({ item, index, gridTemplate }: Props): React.JSX.Element {
  const { t, i18n } = useTranslation("priceList");
  const locale = i18n.language;
  const isEven = index % 2 === 0;
  const tiers = displayTiers(item.tiers);
  const hiddenLabel = t("table.hiddenPrice");

  return (
    <>
      {/* ── Desktop row (md+) ─────────────────────────────────────────── */}
      <Box
        className={cn(
          "hidden md:grid items-center w-full px-5 py-3.5",
          "border-b border-white/5 last:border-0",
          isEven ? "bg-transparent" : "bg-[#0D0718]/40",
        )}
        style={{ gridTemplateColumns: gridTemplate }}
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
        <Box className="flex flex-col gap-0.5 min-w-0">
          <Text as="span" className="font-inter text-[13px] text-white leading-none truncate">
            {item.serviceName}
          </Text>
          <Text as="span" className="font-plex text-[11px] text-white/40 leading-none truncate">
            ID: {item.id}
          </Text>
        </Box>

        {/* Harga Normal */}
        <Text as="span" className="font-plex text-[13px] text-white/80 leading-none">
          {formatCurrency(item.normalPrice, locale)}
        </Text>

        {/* One cell per membership tier, coloured by its rung on the ladder. */}
        {tiers.map((tier, tierIndex) => (
          <Text
            key={tier.planId}
            as="span"
            className="font-plex text-[13px] leading-none truncate"
            style={{ color: tier.isHidden ? undefined : tierColor(tierIndex, tiers.length) }}
          >
            {tierPriceLabel(tier, (value) => formatCurrency(value, locale), hiddenLabel)}
          </Text>
        ))}

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

        {/* Prices row. Wraps rather than being pinned to three columns — the
            number of tiers is data, and a fourth plan must not overflow. */}
        <Box className="flex flex-wrap gap-x-4 gap-y-2">
          <Box className="flex flex-col gap-0.5 min-w-[5.5rem]">
            <Text as="span" className="font-inter text-[10px] text-white/40 leading-none uppercase tracking-wide">
              {t("table.normalPrice")}
            </Text>
            <Text as="span" className="font-plex text-[13px] text-white/80 leading-none">
              {formatCurrency(item.normalPrice, locale)}
            </Text>
          </Box>
          {tiers.map((tier, tierIndex) => {
            const color = tier.isHidden ? "rgba(255,255,255,0.4)" : tierColor(tierIndex, tiers.length);

            return (
              <Box key={tier.planId} className="flex flex-col gap-0.5 min-w-[5.5rem]">
                <Text
                  as="span"
                  className="font-inter text-[10px] leading-none uppercase tracking-wide truncate"
                  style={{ color }}
                >
                  {tier.planName}
                </Text>
                <Text as="span" className="font-plex text-[13px] leading-none" style={{ color }}>
                  {tierPriceLabel(tier, (value) => formatCurrency(value, locale), hiddenLabel)}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
