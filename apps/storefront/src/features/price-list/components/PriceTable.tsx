import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import PriceTableRow from "@/features/price-list/components/PriceTableRow";
import { displayTiers, tierGridTemplate } from "@/features/price-list/lib/tierColumns";
import type { PriceListItem } from "@/features/price-list/types/priceList.type";

interface Props {
  rows: PriceListItem[];
  /** First load only — `keepPreviousData` keeps paging from flashing a skeleton. */
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export default function PriceTable({
  rows,
  isPending = false,
  isError = false,
  onRetry,
}: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");

  // Columns come from the plans the API returned, not from a fixed list — the
  // old header hardcoded "Gold", which was really a different plan's price.
  // Every row carries the same tiers, so the first is representative.
  const tiers = displayTiers(rows[0]?.tiers ?? []);
  const gridTemplate = tierGridTemplate(tiers.length);

  return (
    <Box className="rounded-2xl overflow-hidden border border-white/8">
      {/* ── Desktop column header (md+) ── */}
      <Box
        className="hidden md:grid px-5 py-3.5 bg-[rgb(39,53,15)]"
        style={{ gridTemplateColumns: gridTemplate }}
      >
        <Text as="span" className="font-outfit font-semibold text-[13px] text-white leading-none">
          {t("table.game")}
        </Text>
        <Text as="span" className="font-outfit font-semibold text-[13px] text-white leading-none">
          {t("table.service")}
        </Text>
        <Text as="span" className="font-outfit font-semibold text-[13px] text-white leading-none">
          {t("table.normalPrice")}
        </Text>
        {tiers.map((tier) => (
          <Text
            key={tier.planId}
            as="span"
            className="font-outfit font-semibold text-[13px] text-white leading-none truncate"
          >
            {tier.planName}
          </Text>
        ))}
        <Text as="span" className="font-outfit font-semibold text-[13px] text-white leading-none text-center">
          {t("table.status")}
        </Text>
      </Box>

      {/* ── Mobile column header (< md) ── */}
      <Box className="md:hidden grid grid-cols-2 px-4 py-3 bg-[rgb(39,53,15)]">
        <Text as="span" className="font-outfit font-semibold text-[12px] text-white leading-none">
          {t("table.service")}
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
      ) : isPending ? (
        <Box aria-busy="true" className="flex flex-col gap-2 p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </Box>
      ) : rows.length === 0 ? (
        <EmptyState compact title={t("emptyState")} />
      ) : (
        rows.map((item, index) => (
          <PriceTableRow key={item.id} item={item} index={index} gridTemplate={gridTemplate} />
        ))
      )}
    </Box>
  );
}
