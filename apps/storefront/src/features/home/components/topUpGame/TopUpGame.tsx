import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { GAME_CATEGORIES, TOP_UP_GAMES } from "@/features/home/data/topUpGames.data";
import type { GameCategory } from "@/features/home/types/topUpGames.type";
import CategoryTabs from "./fragments/CategoryTabs";
import TopUpGameCard from "./fragments/TopUpGameCard";

export default function TopUpGame(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<GameCategory>("semua");

  const visibleGames =
    activeTab === "semua"
      ? TOP_UP_GAMES
      : TOP_UP_GAMES.filter((g) => g.category === activeTab);

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
              className="font-outfit font-bold text-[28px] leading-7 tracking-[-0.5px] text-white uppercase"
            >
              Top Up Game
            </Heading>
          </Box>
          <Text as="p" className="font-inter font-normal text-[14px] leading-5 text-[#697282]">
            Pilih game favoritmu dan lakukan top up dengan cepat, aman, dan praktis.
          </Text>
        </Box>

        {/* Category tabs */}
        <Box className="mb-8">
          <CategoryTabs
            tabs={GAME_CATEGORIES}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </Box>

        {/* 2 × 6 game card grid */}
        <Box className="grid grid-cols-6 gap-4 mb-10">
          {visibleGames.map((game) => (
            <TopUpGameCard key={game.id} game={game} />
          ))}
        </Box>

        {/* Show more */}
        <Box className="flex justify-center">
          <Box
            as="button"
            type="button"
            className="flex items-center gap-2 px-8 py-3 rounded-full border border-[#9333EA] text-[#9333EA] text-[13px] font-semibold font-outfit uppercase tracking-widest hover:bg-[#9333EA]/10 active:bg-[#9333EA]/20 transition-colors cursor-pointer"
          >
            Tampilkan Lebih Banyak
            <ChevronDown className="w-4 h-4 shrink-0" />
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
