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
 * Horizontal result row shown while the user types in the search bar (mockup #2).
 * Renders: small square thumbnail (art + mini logo overlay) + game title + region.
 * Violet highlight on hover.
 *
 * TODO: wire onClose to navigate to /{locale}/checkout/{slug} when routing is ready.
 */
export function SearchResultRow({ game, onClose }: Props): React.JSX.Element {
  return (
    <Box
      as="button"
      type="button"
      onClick={onClose}
      className="flex items-center gap-3.5 w-full px-4 py-3 rounded-xl hover:bg-[#9333EA]/15 active:bg-[#9333EA]/25 transition-colors outline-none cursor-pointer text-left"
    >
      {/* Square thumbnail */}
      <Box className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#0C0C16]">
        <Image
          src={game.bgImage}
          alt={game.title}
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
        />
        {/* Mini logo overlay — only when the category has a logo */}
        {game.logoImage && (
          <Box className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Image
              src={game.logoImage}
              alt={`${game.title} logo`}
              objectFit="contain"
              className="w-9 h-5"
            />
          </Box>
        )}
      </Box>

      {/* Title & region */}
      <Box>
        <Heading
          as="h4"
          level={6}
          className="font-outfit font-semibold text-[14px] text-white leading-tight"
        >
          {game.title}
        </Heading>
        <Text
          as="p"
          className="font-inter text-[12px] text-white/50 leading-tight mt-0.5"
        >
          {game.region}
        </Text>
      </Box>
    </Box>
  );
}
