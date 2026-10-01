import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import SectionCard from "@/features/checkout/components/SectionCard";
import { useGameProductsQuery } from "@/features/checkout/hooks/useCheckoutQueries";
import PackageCategoryTabs from "./fragments/PackageCategoryTabs";
import PackageCard from "./fragments/PackageCard";
import type { CategoryTab, DiamondPackage, PackageCategory } from "@/features/checkout/types/checkout.type";

interface Props {
  packages: DiamondPackage[];
  /** Group tabs in API order — also the order the sections render in. */
  categories: CategoryTab[];
  selectedPackageId: string | null;
  activeCategory: PackageCategory;
  onSelectPackage: (id: string) => void;
  onCategoryChange: (cat: PackageCategory) => void;
  /** The products request, for the loading / error / empty states. */
  query: ReturnType<typeof useGameProductsQuery>;
}

function PackagesSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="flex flex-col gap-5">
      <Box className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} shape="pill" className="h-9 w-24 shrink-0" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </Box>
    </Box>
  );
}

export default function DiamondPackages({
  packages,
  categories,
  selectedPackageId,
  activeCategory,
  onSelectPackage,
  onCategoryChange,
  query,
}: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  // Sections follow the API's group order rather than a hardcoded list, so a
  // game whose admin defines different sub-categories renders correctly.
  const groups = categories
    .map(({ key, label }) => ({
      cat: key,
      label,
      items: packages.filter((pkg) => pkg.category === key),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <SectionCard stepNumber={2} title={t("packages.title")} gradientBorder>
      <QueryState
        query={query}
        skeleton={<PackagesSkeleton />}
        isEmpty={(data) => data.packages.length === 0}
        empty={
          <EmptyState
            compact
            title={t("packages.empty.title")}
            description={t("packages.empty.description")}
          />
        }
      >
        {() => (
          <Box className="flex flex-col gap-5">
            {/* Category tabs */}
            <PackageCategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />

            {/* Grouped package lists */}
            {groups.map(({ cat, label, items }) => (
              <Box key={cat} className="flex flex-col gap-3">
                {/* Section heading */}
                <Text
                  as="span"
                  className="font-outfit font-semibold text-[15px] text-white leading-none"
                >
                  {t(`packages.groupTitles.${cat}`, { defaultValue: label })}
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
        )}
      </QueryState>
    </SectionCard>
  );
}
