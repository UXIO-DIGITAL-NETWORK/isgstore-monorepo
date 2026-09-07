import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import PriceTableRow from "@/features/price-list/components/PriceTableRow";
import { displayTiers, tierGridTemplate } from "@/features/price-list/lib/tierColumns";
import type { PriceListItem } from "@/features/price-list/types/priceList.type";

interface Props {
  rows: PriceListItem[];
}

export default function PriceTable({ rows }: Props): React.JSX.Element {
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
        className="hidden md:grid px-5 py-3.5 bg-[#3A1D6E]"
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
          <PriceTableRow key={item.id} item={item} index={index} gridTemplate={gridTemplate} />
        ))
      )}
    </Box>
  );
}
