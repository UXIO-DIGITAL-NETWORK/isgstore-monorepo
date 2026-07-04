import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";
import type { TopUpGame } from "@/features/home/types/topUpGames.type";

type Props = {
  game: TopUpGame;
};

export default function TopUpGameCard({ game }: Props): React.JSX.Element {
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  return (
    <Link
      href={`/${locale}/checkout/${game.id}`}
      className={cn(
        "group relative block rounded-xl overflow-hidden cursor-pointer aspect-3/4",
        game.borderColor === "azure"
          ? "border border-[#3B82F6]/50 shadow-[0_0_12px_rgba(59,130,246,0.15)]"
          : "border border-[#9333EA]/50 shadow-[0_0_12px_rgba(147,51,234,0.15)]"
      )}
    >
      {/* Background art — scales on card hover, clipped by card overflow-hidden */}
      <Image
        src={game.bgImage}
        alt={game.title}
        objectFit="cover"
        className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out group-hover:scale-110"
      />

      {/* Scrim — darkens toward bottom for logo/region legibility */}
      <Box className="absolute inset-0 bg-linear-to-b from-black/10 via-black/20 to-black/80 pointer-events-none" />

      {/* Game logo — positioned above the region pill */}
      <Box className="absolute inset-x-0 bottom-13 h-14 flex items-center justify-center px-4">
        <Image
          src={game.logoImage}
          alt={`${game.title} logo`}
          objectFit="contain"
          className="w-20 h-8 md:w-28 md:h-10"
        />
      </Box>

      {/* Region pill — gradient border, floating with mx-3 mb-3 inset */}
      <Box className="absolute inset-x-2 bottom-3 p-px rounded-lg bg-linear-to-r from-[#9333EA] to-[#3B82F6]">
        <Box className="rounded-[7px] bg-[#080814]/90 backdrop-blur-sm h-9 flex items-center justify-center">
          <Text
            as="span"
            className="font-inter text-[12px] font-semibold leading-none text-white/90 tracking-wide"
          >
            {game.region}
          </Text>
        </Box>
      </Box>
    </Link>
  );
}
