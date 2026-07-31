import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { deriveCategoryTabs, useGamesQuery } from "@/hooks/useGamesQuery";
import type { GameCategory } from "@/features/home/types/topUpGames.type";
import CategoryTabs from "./fragments/CategoryTabs";
import TopUpGameCard from "./fragments/TopUpGameCard";

export default function TopUpGame(): React.JSX.Element {
  const { t } = useTranslation("home");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const [activeTab, setActiveTab] = useState<GameCategory>("semua");

  const { data: games } = useGamesQuery();
  const allGames = useMemo(() => games ?? [], [games]);

  // Tabs come from the categories present in the catalog, so selecting one can
  // never land on an empty grid.
  const tabs = useMemo(
    () => [{ key: "semua" as GameCategory, label: "Semua" }, ...deriveCategoryTabs(allGames)],
    [allGames],
  );

  const visibleGames =
    activeTab === "semua" ? allGames : allGames.filter((g) => g.category === activeTab);

  return (
    <Box as="section" className="w-full pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section heading */}
        <Box className="flex flex-col gap-2.5 mb-6">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-5 rounded-full bg-[#3B82F6] shrink-0" />
            <Heading
              as="h2"
              level={4}
              className="font-outfit font-bold text-[22px] md:text-[28px] leading-7 tracking-[-0.5px] text-white uppercase"
            >
              {t("topUpGame.title")}
            </Heading>
          </Box>
          <Text as="p" className="font-inter font-normal text-[14px] leading-5 text-[#697282]">
            {t("topUpGame.subtitle")}
          </Text>
        </Box>

        {/* Category tabs */}
        <Box className="mb-8">
          <CategoryTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Box>

        {/* 2 × 6 game card grid */}
        <Box className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-10">
          {visibleGames.map((game) => (
            <TopUpGameCard key={game.id} game={game} />
          ))}
        </Box>

        {/* Show more */}
        <Box className="flex justify-center">
          <Link
            href={`/${locale}/daftar-harga`}
            className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#9333EA] text-[#9333EA] text-[13px] font-semibold font-outfit uppercase tracking-widest hover:bg-[#9333EA]/10 active:bg-[#9333EA]/20 transition-colors cursor-pointer"
          >
            {t("topUpGame.showMore")}
            <ChevronDown className="w-4 h-4 shrink-0" />
          </Link>
        </Box>

      </Box>
    </Box>
  );
}
