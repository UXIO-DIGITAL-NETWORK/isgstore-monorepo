import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import TransactionRowComponent, {
  TABLE_GRID_COLS,
} from "@/features/track-order/components/TransactionRow";
import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";

const HEADER_COLS: { key: string; i18nKey: string; className?: string }[] = [
  { key: "date",    i18nKey: "table.date" },
  { key: "invoice", i18nKey: "table.invoice" },
  { key: "game",    i18nKey: "table.game" },
  { key: "service", i18nKey: "table.service" },
  { key: "gold",    i18nKey: "table.gold" },
  { key: "status",  i18nKey: "table.status", className: "text-center" },
];

interface Props {
  rows: TrackOrderRow[];
  /** A request is in flight for a query the customer has submitted. */
  isSearching?: boolean;
  /** False until the first search — the table then invites one instead of
   *  claiming nothing matched. */
  hasSearched?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function TransactionTable({
  rows,
  isSearching = false,
  hasSearched = true,
  isError = false,
  onRetry,
}: Props): React.JSX.Element {
  const { t } = useTranslation("trackOrder");

  return (
    <Box className="rounded-2xl overflow-hidden border border-white/8">
      {/* ── Desktop column header (md+) ── */}
      <Box className={`hidden md:grid ${TABLE_GRID_COLS} px-5 py-3.5 bg-[rgb(39,53,15)]`}>
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
      <Box className="md:hidden grid grid-cols-2 px-4 py-3 bg-[rgb(39,53,15)]">
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none">
          {t("table.invoice")}
        </Text>
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none text-right">
          {t("table.status")}
        </Text>
      </Box>

      {/* ── Rows ── */}
      {isError ? (
        <Box className="p-4">
          <ErrorState variant="inline" onRetry={onRetry} />
        </Box>
      ) : isSearching ? (
        <Box aria-busy="true" className="flex flex-col gap-2 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </Box>
      ) : !hasSearched ? (
        <EmptyState compact title={t("searchPrompt")} />
      ) : rows.length === 0 ? (
        <EmptyState compact title={t("emptyState")} />
      ) : (
        rows.map((row, index) => (
          <TransactionRowComponent key={row.invoiceNumber} row={row} index={index} />
        ))
      )}
    </Box>
  );
}
