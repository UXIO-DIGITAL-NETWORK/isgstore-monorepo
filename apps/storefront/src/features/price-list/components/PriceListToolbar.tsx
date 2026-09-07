import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Box } from "@/components/common/Box";
import SortDropdown from "@/features/price-list/components/SortDropdown";
import type { UseFormReturn } from "react-hook-form";
import type { PriceListSearchValues } from "@/features/price-list/schemas/priceList.schema";
import type { SortOption } from "@/features/price-list/types/priceList.type";

interface Props {
  form: UseFormReturn<PriceListSearchValues>;
  sortOption: SortOption;
  onSortChange: (opt: SortOption) => void;
  onQueryChange: () => void;
}

export default function PriceListToolbar({
  form,
  sortOption,
  onSortChange,
  onQueryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");
  const { register } = form;

  return (
    <Box className="flex items-center justify-between gap-3 mb-4">
      {/* ── Left: sort dropdown ── */}
      <SortDropdown value={sortOption} onChange={onSortChange} />

      {/* ── Right: search input ── */}
      <Box className="relative flex items-center flex-1 max-w-[340px]">
        <Search className="absolute left-3.5 w-4 h-4 text-[#909AAE] pointer-events-none" />
        <input
          {...register("query", {
            onChange: onQueryChange,
          })}
          type="text"
          placeholder={t("toolbar.searchPlaceholder")}
          className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2.5 text-[13px] font-inter text-white placeholder:text-[#909AAE] outline-none focus:border-[#3B82F6]/50 transition-all"
        />
      </Box>
    </Box>
  );
}
