import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { POPULAR_GAMES } from "@/features/home/data/popularGames.data";
import PopularGameCard from "./fragments/PopularGameCard";

export default function PopularGames(): React.JSX.Element {
  const lastIndex = POPULAR_GAMES.length - 1;

  return (
    <Box as="section" className="w-full bg-background pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section header */}
        <Box className="flex flex-col gap-2.5 mb-6">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-5 rounded-full bg-[#3B82F6] shrink-0" />
            <Heading
              as="h2"
              level={4}
              className="font-outfit font-bold text-[28px] leading-7 tracking-[-0.5px] text-white uppercase"
            >
              Game Populer Hari Ini
            </Heading>
          </Box>
          <Text as="p" className="font-inter font-normal text-[14px] leading-5 text-[#697282]">
            Pilih kategori favoritmu dan lakukan top up dengan proses cepat, aman, dan tanpa ribet.
          </Text>
        </Box>

        {/* Scroll row with right-edge fade overlay */}
        <Box className="relative">
          <Box
            className="flex gap-5 overflow-x-auto no-scrollbar"
            aria-label="Game populer"
          >
            {POPULAR_GAMES.map((game, index) => (
              <PopularGameCard
                key={game.id}
                game={game}
                isFeatured={index === 0}
                tintVariant={index === 0 || index === lastIndex ? "edge" : "middle"}
              />
            ))}
          </Box>

          {/* Right-edge decorative fade */}
          <Box
            aria-hidden
            className="absolute inset-y-0 right-0 w-26.25 pointer-events-none bg-linear-to-r from-transparent to-[#0A0A0C]"
          />
        </Box>

      </Box>
    </Box>
  );
}
