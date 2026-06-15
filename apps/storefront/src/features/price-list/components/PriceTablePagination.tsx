import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Returns the list of page numbers / ellipsis sentinels to render */
function buildPageWindow(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}

export default function PriceTablePagination({
  currentPage,
  totalPages,
  onPageChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");

  const pageWindow = useMemo(
    () => buildPageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 1) return <></>;

  return (
    <Box className="flex items-center justify-end gap-1 pt-4">
      {/* ── Prev ── */}
      <Box
        as="button"
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-inter font-medium transition-colors select-none",
          currentPage === 1
            ? "text-white/25 cursor-not-allowed"
            : "text-white/65 hover:text-white hover:bg-white/5 cursor-pointer",
        )}
      >
        <ChevronLeft className="w-4 h-4" />
        {t("pagination.prev")}
      </Box>

      {/* ── Page numbers ── */}
      {pageWindow.map((item, idx) =>
        item === "…" ? (
          <Text
            key={`ellipsis-${idx}`}
            as="span"
            className="w-8 text-center font-inter text-[13px] text-white/30 select-none"
          >
            …
          </Text>
        ) : (
          <Box
            key={item}
            as="button"
            type="button"
            onClick={() => onPageChange(item as number)}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-[13px] font-inter font-medium transition-colors select-none",
              item === currentPage
                ? "bg-[#9234EA] text-white"
                : "text-white/55 hover:bg-white/8 hover:text-white cursor-pointer",
            )}
          >
            {item}
          </Box>
        ),
      )}

      {/* ── Next ── */}
      <Box
        as="button"
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={cn(
          "flex items-center gap-1 px-3 py-2 rounded-lg text-[13px] font-inter font-medium transition-colors select-none",
          currentPage === totalPages
            ? "text-white/25 cursor-not-allowed"
            : "text-white/65 hover:text-white hover:bg-white/5 cursor-pointer",
        )}
      >
        {t("pagination.next")}
        <ChevronRight className="w-4 h-4" />
      </Box>
    </Box>
  );
}
