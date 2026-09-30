import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function TablePagination({ page, totalPages, onChange }: Props): React.JSX.Element {
  const { t } = useTranslation("dashboard");

  if (totalPages <= 1) return <></>;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Box className="flex items-center justify-end gap-1.5 px-4 py-3.5 border-t border-white/8">
      {/* Prev */}
      <Box
        as="button"
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-outfit font-semibold leading-none transition-all",
          page === 1
            ? "text-white/20 cursor-not-allowed"
            : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8 cursor-pointer",
        )}
      >
        <ChevronLeft className="w-3 h-3" />
        {t("transactionHistory.pagination.prev")}
      </Box>

      {/* Page numbers */}
      {pages.map((p) => (
        <Box
          as="button"
          type="button"
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-full text-[12px] font-plex font-bold leading-none transition-all cursor-pointer",
            p === page
              ? "bg-[rgb(208,201,129)] text-white"
              : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/8",
          )}
        >
          <Text as="span">{p}</Text>
        </Box>
      ))}

      {/* Next */}
      <Box
        as="button"
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-outfit font-semibold leading-none transition-all",
          page === totalPages
            ? "text-white/20 cursor-not-allowed"
            : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/8 cursor-pointer",
        )}
      >
        {t("transactionHistory.pagination.next")}
        <ChevronRight className="w-3 h-3" />
      </Box>
    </Box>
  );
}
