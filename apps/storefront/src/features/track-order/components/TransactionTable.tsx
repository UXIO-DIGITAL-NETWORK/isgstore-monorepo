import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import TransactionRowComponent, {
  TABLE_GRID_COLS,
} from "@/features/track-order/components/TransactionRow";
import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";

const HEADER_COLS: { key: string; i18nKey: string; className?: string }[] = [
  { key: "date",    i18nKey: "table.date" },
  { key: "invoice", i18nKey: "table.invoice" },
  { key: "service", i18nKey: "table.service" },
  { key: "gold",    i18nKey: "table.gold" },
  { key: "status",  i18nKey: "table.status", className: "text-center" },
];

interface Props {
  rows: TrackOrderRow[];
}

export default function TransactionTable({ rows }: Props): React.JSX.Element {
  const { t } = useTranslation("trackOrder");

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
          {t("table.invoice")}
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
        rows.map((row, index) => (
          <TransactionRowComponent key={row.invoiceNumber} row={row} index={index} />
        ))
      )}
    </Box>
  );
}
