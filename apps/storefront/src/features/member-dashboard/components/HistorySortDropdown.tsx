import React from "react";
import { useTranslation } from "react-i18next";
import { Filter, ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onToggle: () => void;
}

export default function HistorySortDropdown({ open, onToggle }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  return (
    <Box className="p-px rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA]">
      <Box
        as="button"
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0C0A1A] text-white text-[13px] font-outfit font-semibold leading-none transition-colors cursor-pointer select-none hover:bg-[#9234EA]/20"
      >
        <Filter className="w-3.5 h-3.5" />
        {t("transactionHistory.filterButton")}
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")}
        />
      </Box>
    </Box>
  );
}
