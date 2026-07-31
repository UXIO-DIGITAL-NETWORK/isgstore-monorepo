import React from "react";
import { useTranslation } from "react-i18next";
import { cva } from "class-variance-authority";
import { Box } from "@/components/common/Box";
import { cn } from "@/lib/utils";
import type { CategoryTab, GameCategory } from "@/features/home/types/topUpGames.type";

const tabVariants = cva(
  "px-5 py-2 rounded-full text-sm font-outfit whitespace-nowrap cursor-pointer select-none outline-none transition-colors",
  {
    variants: {
      active: {
        true: "bg-[#9333EA] text-white font-semibold",
        false: "bg-white/[0.06] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90",
      },
    },
    defaultVariants: { active: false },
  }
);

type Props = {
  tabs: CategoryTab[];
  activeTab: GameCategory;
  onTabChange: (key: GameCategory) => void;
};

export default function CategoryTabs({ tabs, activeTab, onTabChange }: Props): React.JSX.Element {
  const { t } = useTranslation("home");
  return (
    <Box className="flex items-center gap-3 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => (
        <Box
          key={tab.key}
          as="button"
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={cn(tabVariants({ active: activeTab === tab.key }))}
        >
          {/* Categories that already have a translation keep it; anything the
              admin adds later falls back to the label derived from the API. */}
          {t(`topUpGame.categories.${tab.key}`, { defaultValue: tab.label })}
        </Box>
      ))}
    </Box>
  );
}
