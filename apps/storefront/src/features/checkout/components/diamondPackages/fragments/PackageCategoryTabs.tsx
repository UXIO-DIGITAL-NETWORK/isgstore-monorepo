import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { PackageCategory } from "@/features/checkout/types/checkout.type";

const tabVariants = cva(
  "px-4 py-1.5 rounded-full text-[12px] font-outfit whitespace-nowrap cursor-pointer select-none outline-none transition-colors",
  {
    variants: {
      active: {
        true: "bg-[#9333EA] text-white font-semibold",
        false: "bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90",
      },
    },
    defaultVariants: { active: false },
  },
);

const CATEGORIES: PackageCategory[] = ["all", "weekly", "monthly", "special"];

interface Props {
  activeCategory: PackageCategory;
  onCategoryChange: (cat: PackageCategory) => void;
}

export default function PackageCategoryTabs({
  activeCategory,
  onCategoryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <Box className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {CATEGORIES.map((cat) => (
        <Box
          key={cat}
          as="button"
          type="button"
          onClick={() => onCategoryChange(cat)}
          className={cn(tabVariants({ active: activeCategory === cat }))}
        >
          {t(`packages.categories.${cat}`)}
        </Box>
      ))}
    </Box>
  );
}
