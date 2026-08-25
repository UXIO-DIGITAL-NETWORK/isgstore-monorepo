import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import type { Game } from "@/types/game.type";

type Props = {
  game: Game;
  onClose: () => void;
};

/**
 * Portrait game card shown in the "Pencarian Populer" row (mockup #1).
 * Renders: full-bleed art image → bottom-scrim → logo overlay → gradient-border
 * region pill. Below the card: game title + region label.
 *
 * TODO: wire onClose to navigate to /{locale}/checkout/{slug} when routing is ready.
 */
export function SearchPopularCard({ game, onClose }: Props): React.JSX.Element {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClose}
      className="shrink-0 w-34 flex flex-col gap-2 outline-none group cursor-pointer"
    >
      {/* Portrait art card */}
      <Box className="w-full aspect-3/4 rounded-xl overflow-hidden relative bg-[#0C0C16]">
        {/* Background art */}
        <Image
          src={game.bgImage}
          alt={game.title}
          objectFit="cover"
          className="absolute inset-0 w-full h-full transition-transform duration-300 ease-out group-hover:scale-105"
        />

        {/* Bottom scrim for logo + pill legibility */}
        <Box className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-b from-transparent to-black/80 pointer-events-none" />

        {/* Game logo — sits above the region pill; only when the category has one */}
        {game.logoImage && (
          <Box className="absolute inset-x-0 bottom-10 flex items-center justify-center px-2">
            <Image
              src={game.logoImage}
              alt={`${game.title} logo`}
              objectFit="contain"
              className="w-16 h-7"
            />
          </Box>
        )}

        {/* Region pill — gradient border */}
        <Box className="absolute inset-x-2 bottom-2 p-px rounded-md bg-linear-to-r from-[#9333EA] to-[#3B82F6]">
          <Box className="rounded-[5px] bg-[#080814]/90 h-7 flex items-center justify-center">
            <Text
              as="span"
              className="font-inter text-[10px] font-semibold leading-none text-white/90 tracking-wide"
            >
              {game.region}
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Title & region below card */}
      <Box className="text-left">
        <Heading
          as="h4"
          level={6}
          className="font-outfit font-semibold text-[13px] text-white leading-tight line-clamp-1"
        >
          {game.title}
        </Heading>
        <Text
          as="p"
          className="font-inter text-[11px] text-white/50 leading-tight mt-0.5 line-clamp-1"
        >
          {game.region}
        </Text>
      </Box>
    </Box>
  );
}
