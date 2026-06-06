import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
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

export default function DiamondPackages({
  packages,
  selectedPackageId,
  activeCategory,
  onSelectPackage,
  onCategoryChange,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <SectionCard stepNumber={2} title={t("packages.title")}>
      <Box className="flex flex-col gap-4">
        {/* Category tabs */}
        <PackageCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />

        {/* Package grid */}
        <Box className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              isSelected={selectedPackageId === pkg.id}
              onSelect={onSelectPackage}
            />
          ))}
        </Box>
      </Box>
    </SectionCard>
  );
}
