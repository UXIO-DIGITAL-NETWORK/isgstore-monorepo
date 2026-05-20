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
            {/* Accent bar — #3B82F6 blue from popular.svg, not the project's violet primary */}
            <Box className="w-1 h-5 rounded-full bg-blue-500 shrink-0" />
            <Heading
              as="h2"
              level={2}
              className="text-h4 font-bold font-display text-foreground"
              // text-h4 (30px) is the closest token to the design's 28px title
            >
              Game Populer Hari Ini
            </Heading>
          </Box>
          <Text as="p" className="text-base text-muted-foreground">
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

          {/* Right-edge decorative fade — #0A0A0B → transparent, matching popular.svg's paint12 */}
          <Box
            className="absolute inset-y-0 right-0 w-24 pointer-events-none"
            style={{ background: "linear-gradient(to right, transparent, #0A0A0B)" }}
          />
        </Box>

      </Box>
    </Box>
  );
}
