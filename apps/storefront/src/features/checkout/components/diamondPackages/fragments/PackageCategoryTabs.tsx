import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import { ALL_CATEGORY, type CategoryTab, type PackageCategory } from "@/features/checkout/types/checkout.type";

const tabVariants = cva(
  "px-4 py-1.5 rounded-full text-[12px] font-outfit whitespace-nowrap cursor-pointer select-none outline-none transition-colors",
  {
    variants: {
      active: {
        true: "bg-[rgb(208,201,129)] text-white font-semibold",
        false: "border border-white/[0.12] bg-white/[0.02] text-white/55 hover:text-white/90 hover:border-white/25",
      },
    },
    defaultVariants: { active: false },
  },
);

interface Props {
  /** Group tabs after the leading "all", derived from the game's sub-categories. */
  categories: CategoryTab[];
  activeCategory: PackageCategory;
  onCategoryChange: (cat: PackageCategory) => void;
}

export default function PackageCategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  // "all" is always first and always translated; the rest come from the API.
  const tabs: CategoryTab[] = [
    { key: ALL_CATEGORY, label: t("packages.categories.all") },
    ...categories,
  ];

  return (
    <Box className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <Box
          key={tab.key}
          as="button"
          type="button"
          onClick={() => onCategoryChange(tab.key)}
          className={cn(tabVariants({ active: activeCategory === tab.key }))}
        >
          {/* Groups that already have a translation keep it; anything the admin
              adds later falls back to the label the API sent. */}
          {t(`packages.categories.${tab.key}`, { defaultValue: tab.label })}
        </Box>
      ))}
    </Box>
  );
}
