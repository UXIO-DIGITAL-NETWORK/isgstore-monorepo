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
        true: "bg-[#9234EA] text-white font-semibold",
        false: "border border-white/[0.12] bg-white/[0.02] text-white/55 hover:text-white/90 hover:border-white/25",
      },
    },
    defaultVariants: { active: false },
  },
);

const CATEGORIES: PackageCategory[] = ["all", "weekly", "firstTopUp", "diamonds", "special"];

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
