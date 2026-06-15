import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Check } from "lucide-react";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { SortOption } from "@/features/price-list/types/priceList.type";

const SORT_OPTIONS: SortOption[] = ["default", "name-asc", "price-asc", "price-desc"];

interface Props {
  value: SortOption;
  onChange: (opt: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: Props): React.JSX.Element {
  const { t } = useTranslation("priceList");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <Box ref={containerRef} className="relative">
      {/* ── Trigger button ── */}
      <Box
        as="button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 px-4 py-2.5 rounded-full border text-[13px] font-inter font-medium text-white transition-all outline-none select-none whitespace-nowrap",
          open
            ? "bg-white/10 border-[#9234EA]/60"
            : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20",
        )}
      >
        {t(`sort.${value}`)}
        <ChevronDown
          className={cn("w-4 h-4 text-white/60 transition-transform duration-200", open && "rotate-180")}
        />
      </Box>

      {/* ── Dropdown menu ── */}
      {open && (
        <Box className="absolute left-0 top-full mt-1.5 z-20 min-w-[180px] rounded-xl border border-white/10 bg-[#12082a] shadow-lg overflow-hidden">
          {SORT_OPTIONS.map((opt) => (
            <Box
              key={opt}
              as="button"
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] font-inter transition-colors",
                opt === value
                  ? "text-[#C084FC] bg-[#9234EA]/10"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              {t(`sort.${opt}`)}
              {opt === value && <Check className="w-3.5 h-3.5 text-[#C084FC]" />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
