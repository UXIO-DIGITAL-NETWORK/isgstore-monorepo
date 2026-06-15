import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import PriceTableRow, { TABLE_GRID_COLS } from "@/features/price-list/components/PriceTableRow";
import type { PriceListItem } from "@/features/price-list/types/priceList.type";

const HEADER_COLS: { key: string; i18nKey: string; className?: string }[] = [
  { key: "game",        i18nKey: "table.game" },
  { key: "service",     i18nKey: "table.service" },
  { key: "normalPrice", i18nKey: "table.normalPrice" },
  { key: "member",      i18nKey: "table.member" },
  { key: "gold",        i18nKey: "table.gold" },
  { key: "status",      i18nKey: "table.status", className: "text-center" },
];

interface Props {
  rows: PriceListItem[];
}

export default function PriceTable({ rows }: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");

  return (
    <Box className="rounded-2xl overflow-hidden border border-white/8">
      {/* ── Desktop column header (md+) ── */}
      <Box className={`hidden md:grid ${TABLE_GRID_COLS} px-5 py-3.5 bg-[#3A1D6E]`}>
        {HEADER_COLS.map((col) => (
          <Text
            key={col.key}
            as="span"
            className={`font-outfit font-semibold text-[13px] text-white leading-none ${col.className ?? ""}`}
          >
            {t(col.i18nKey)}
          </Text>
        ))}
      </Box>

      {/* ── Mobile column header (< md) ── */}
      <Box className="md:hidden grid grid-cols-2 px-4 py-3 bg-[#3A1D6E]">
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none">
          {t("table.service")}
        </Text>
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none text-right">
          {t("table.status")}
        </Text>
      </Box>

      {/* ── Rows ── */}
      {rows.length === 0 ? (
        <Box className="px-4 py-14 flex items-center justify-center">
          <Text as="p" className="font-inter text-[14px] text-white/40 text-center">
            {t("emptyState")}
          </Text>
        </Box>
      ) : (
        rows.map((item, index) => (
          <PriceTableRow key={item.id} item={item} index={index} />
        ))
      )}
    </Box>
  );
}
