import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import type { PopularGame } from "@/features/home/types/popularGames.type";

type TintVariant = "edge" | "middle";

type Props = {
  game: PopularGame;
  isFeatured: boolean;
  tintVariant: TintVariant;
};

// Legibility gradient per popular.svg: edge cards (1 & 6) fade through #14223A → #0C0F16;
// middle cards (2–5) fade to #0C0C16.
const legibilityGradient: Record<TintVariant, string> = {
  edge: "linear-gradient(to bottom, transparent 0%, #14223A 60%, #0C0F16 100%)",
  middle: "linear-gradient(to bottom, transparent 0%, #0C0C16 100%)",
};

function CardInner({ game, tintVariant }: { game: PopularGame; tintVariant: TintVariant }) {
  return (
    // 304px fixed height so image fills the card; text lives over the gradient overlay
    <Box className="relative rounded-[10px] overflow-hidden h-[304px]">
      {/* Game image — full bleed */}
      <Image
        src={game.image}
        alt={game.title}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />

      {/* Colour tint overlay — #9C3BF6 (purple) for edge cards, #443BF6 (indigo) for middle */}
      {tintVariant === "edge" ? (
        // #9C3BF6 has no exact Tailwind match — from popular.svg edge-card overlay
        <Box className="absolute inset-0 bg-[#9C3BF6]/5 pointer-events-none" />
      ) : (
        // #443BF6 has no exact Tailwind match — from popular.svg middle-card overlay
        <Box className="absolute inset-0 bg-[#443BF6]/5 pointer-events-none" />
      )}

      {/* Dark-fade gradient for text legibility */}
      <Box
        className="absolute inset-0 pointer-events-none"
        style={{ background: legibilityGradient[tintVariant] }}
      />

      {/* Badge — top-right, unified blue→purple gradient matching popular.svg */}
      <Box className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-linear-to-br from-blue-500 to-purple-600">
        <Text
          as="span"
          className="text-body-sm leading-none"
        >
          {game.badge.emoji}
        </Text>
        <Text
          as="span"
          className="text-body-sm font-semibold text-white uppercase tracking-wide leading-none"
        >
          {game.badge.label}
        </Text>
      </Box>

      {/* Text container — absolute at card bottom, over gradient */}
      <Box className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3">
        <Heading
          as="h3"
          level={6}
          className="text-[21px] font-semibold font-display text-white leading-snug line-clamp-2"
          // 21px from popular.svg / Figma JSON — text-h5 (25px) too large, text-h6 (20px) 1px off
        >
          {game.title}
        </Heading>
        <Text
          as="p"
          className="text-body-sm font-semibold text-white/60 mt-0.5"
        >
          {game.subtitle}
        </Text>
      </Box>
    </Box>
  );
}

export default function PopularGameCard({ game, isFeatured, tintVariant }: Props): React.JSX.Element {
  if (isFeatured) {
    // Gradient-border wrapper trick: 3px padding with purple→blue gradient background
    // matching popular.svg card-1's stroke="url(#paint2)" stroke-width="3"
    return (
      <Box
        as="article"
        className="shrink-0 w-60"
      >
        <Box className="p-[3px] rounded-[13px] bg-linear-to-b from-purple-600 to-blue-500">
          <CardInner
            game={game}
            tintVariant={tintVariant}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      as="article"
      className="shrink-0 w-60 rounded-[10px] border border-[#9333EA]/30"
      // #9333EA = purple-600; thin 1px stroke matching popular.svg non-featured cards
    >
      <CardInner
        game={game}
        tintVariant={tintVariant}
      />
    </Box>
  );
}
