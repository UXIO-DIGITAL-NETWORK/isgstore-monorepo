import React from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { PriceText } from "@/components/common/PriceText";
import StatusPill from "@/features/track-order/components/StatusPill";
import { formatDateTime, formatCurrency } from "@/lib/format";
import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";
import { cn } from "@/lib/utils";

/**
 * Must match the grid template in TransactionTable header.
 * Columns: Date | Invoice | Game | Service | Amount | Status
 */
export const TABLE_GRID_COLS =
  "grid-cols-[1.3fr_2fr_1.4fr_1.4fr_1.1fr_0.8fr]";

interface Props {
  row: TrackOrderRow;
  index: number;
}

export default function TransactionRowComponent({ row, index }: Props): React.JSX.Element {
  const navigate = useNavigate();
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  const handleClick = () => {
    // Navigate using an interpolated path to avoid TanStack Router type constraints
    // on cross-level route params.
    void navigate({ to: `/${locale}/invoice/${row.invoiceNumber}` as string });
  };

  const isEven = index % 2 === 0;

  return (
    <>
      {/* ── Desktop row (md+) ─────────────────────────────────────────── */}
      <Box
        as="button"
        type="button"
        onClick={handleClick}
        className={cn(
          `hidden md:grid ${TABLE_GRID_COLS} items-center w-full px-5 py-3`,
          "text-left cursor-pointer transition-colors hover:bg-white/[0.04] outline-none",
          isEven ? "bg-transparent" : "bg-[#0D0718]/40",
        )}
      >
        <Text as="span" className="font-plex text-[13px] text-white/65 leading-none">
          {formatDateTime(row.createdAt, locale)}
        </Text>
        <Text as="span" className="font-plex text-[13px] text-white/80 tracking-wide leading-none">
          {row.invoiceNumber}
        </Text>

        {/* ── Game cell: logo + name ── */}
        <Box className="flex items-center gap-2 min-w-0">
          <img
            src={row.gameLogo}
            alt={row.gameName}
            className="w-7 h-7 rounded-md object-cover flex-shrink-0"
          />
          <Text as="span" className="font-inter text-[12px] text-white/80 leading-tight truncate">
            {row.gameName}
          </Text>
        </Box>

        <Text as="span" className="font-inter text-[13px] text-white/80 leading-none">
          {row.service}
        </Text>
        <PriceText className="text-[13px] leading-none">
          {formatCurrency(row.amount, locale)}
        </PriceText>
        <Box className="flex justify-center">
          <StatusPill status={row.status} />
        </Box>
      </Box>

      {/* ── Mobile card (< md) ────────────────────────────────────────── */}
      <Box
        as="button"
        type="button"
        onClick={handleClick}
        className="md:hidden flex flex-col gap-2 w-full text-left px-4 py-4 cursor-pointer hover:bg-white/[0.04] transition-colors outline-none border-b border-white/6 last:border-0"
      >
        <Box className="flex items-center justify-between gap-2">
          <Text as="span" className="font-plex text-[12px] text-white/55 leading-none">
            {formatDateTime(row.createdAt, locale)}
          </Text>
          <StatusPill status={row.status} />
        </Box>
        <Text as="span" className="font-plex text-[13px] text-white/80 tracking-wide text-left leading-tight break-all">
          {row.invoiceNumber}
        </Text>

        {/* ── Game + service row (mobile) ── */}
        <Box className="flex items-center gap-2">
          <img
            src={row.gameLogo}
            alt={row.gameName}
            className="w-6 h-6 rounded-md object-cover flex-shrink-0"
          />
          <Text as="span" className="font-inter text-[12px] text-purple-300/80 font-medium leading-none">
            {row.gameName}
          </Text>
          <Text as="span" className="font-inter text-[12px] text-white/40 leading-none">
            ·
          </Text>
          <Text as="span" className="font-inter text-[12px] text-white/65 leading-none">
            {row.service}
          </Text>
        </Box>

        <Box className="flex items-center justify-between gap-2">
          <Box className="invisible" />
          <PriceText className="text-[14px] leading-none">
            {formatCurrency(row.amount, locale)}
          </PriceText>
        </Box>
      </Box>
    </>
  );
}
