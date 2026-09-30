import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { POPULAR_BADGES } from "@/features/home/data/popularGames.data";
import { useGamesQuery } from "@/hooks/useGamesQuery";
import type { PopularGame } from "@/features/home/types/popularGames.type";
import PopularGameCard from "./fragments/PopularGameCard";

/** How many games the rail shows before it starts scrolling. */
const RAIL_SIZE = 6;

export default function PopularGames(): React.JSX.Element {
  const { t } = useTranslation("home");

  // Ordered by completed orders server-side, so "popular" reflects real sales
  // rather than a hand-picked list.
  const { data: games } = useGamesQuery({ sort: "popular", perPage: RAIL_SIZE });

  const popularGames = useMemo<PopularGame[]>(
    () =>
      (games ?? []).map((game, index) => ({
        id: game.id,
        title: game.title,
        region: game.region,
        subtitle: game.region,
        image: game.bgImage,
        // Badges are editorial decoration with no server-side equivalent; the
        // existing alternating pattern is preserved by position.
        badge: POPULAR_BADGES[index % POPULAR_BADGES.length],
      })),
    [games],
  );

  const lastIndex = popularGames.length - 1;

  return (
    <Box as="section" className="w-full pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section header */}
        <Box className="flex flex-col gap-2.5 mb-6">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-5 rounded-full bg-[rgb(67,86,32)] shrink-0" />
            <Heading
              as="h2"
              level={4}
              className="font-outfit font-bold text-[22px] md:text-[28px] leading-7 tracking-[-0.5px] text-white uppercase"
            >
              {t("popular.title")}
            </Heading>
          </Box>
          <Text as="p" className="font-inter font-normal text-[14px] leading-5 text-[#697282]">
            {t("popular.subtitle")}
          </Text>
        </Box>

        {/* Scroll row with right-edge fade overlay */}
        <Box className="relative">
          <Box
            className="flex gap-5 overflow-x-auto no-scrollbar"
            aria-label={t("popular.ariaList")}
          >
            {popularGames.map((game, index) => (
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
            className="absolute inset-y-0 right-0 w-26.25 pointer-events-none bg-linear-to-r from-transparent to-[rgb(0,0,0)]"
          />
        </Box>

      </Box>
    </Box>
  );
}
