import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/checkout/components/SectionCard";
import PackageCategoryTabs from "./fragments/PackageCategoryTabs";
import PackageCard from "./fragments/PackageCard";
import type { DiamondPackage, PackageCategory } from "@/features/checkout/types/checkout.type";

interface Props {
  packages: DiamondPackage[];
  selectedPackageId: string | null;
  activeCategory: PackageCategory;
  onSelectPackage: (id: string) => void;
  onCategoryChange: (cat: PackageCategory) => void;
}

const GROUP_ORDER: PackageCategory[] = ["weekly", "firstTopUp", "diamonds", "special"];

export default function DiamondPackages({
  packages,
  selectedPackageId,
  activeCategory,
  onSelectPackage,
  onCategoryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  // Group filtered packages by category, preserving display order
  const groups = GROUP_ORDER.map((cat) => ({
    cat,
    items: packages.filter((pkg) => pkg.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <SectionCard stepNumber={2} title={t("packages.title")} gradientBorder>
      <Box className="flex flex-col gap-5">
        {/* Category tabs */}
        <PackageCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />

        {/* Grouped package lists */}
        {groups.map(({ cat, items }) => (
          <Box key={cat} className="flex flex-col gap-3">
            {/* Section heading */}
            <Text
              as="span"
              className="font-outfit font-semibold text-[15px] text-white leading-none"
            >
              {t(`packages.groupTitles.${cat}`)}
            </Text>

            {/* 3-column grid */}
            <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedPackageId === pkg.id}
                  onSelect={onSelectPackage}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
}
