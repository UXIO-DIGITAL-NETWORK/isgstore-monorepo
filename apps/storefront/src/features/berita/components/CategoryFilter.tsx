import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { BeritaCategoryKey, CategoryPill } from "@/features/berita/types/article.type";

const pillVariants = cva(
  "px-5 py-2 rounded-full text-sm font-outfit font-medium whitespace-nowrap cursor-pointer select-none outline-none transition-all",
  {
    variants: {
      active: {
        true: "bg-linear-to-r from-[#3B82F6] to-[#9234EA] text-white font-semibold shadow-glow-violet",
        false:
          "bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90",
      },
    },
    defaultVariants: { active: false },
  },
);

type Props = {
  categories: CategoryPill[];
  activeCategory: BeritaCategoryKey;
  onCategoryChange: (key: BeritaCategoryKey) => void;
};

export default function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("berita");

  return (
    <Box className="flex items-center gap-3 overflow-x-auto no-scrollbar">
      {categories.map((pill) => (
        <Box
          key={pill.key}
          as="button"
          type="button"
          onClick={() => onCategoryChange(pill.key)}
          className={cn(pillVariants({ active: activeCategory === pill.key }))}
        >
          {t(`categories.${pill.key}`)}
        </Box>
      ))}
    </Box>
  );
}
