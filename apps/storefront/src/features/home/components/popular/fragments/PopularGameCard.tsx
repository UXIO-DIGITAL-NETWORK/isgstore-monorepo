import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import { cn } from "@/lib/utils";
import type { PopularGame } from "@/features/home/types/popularGames.type";

type TintVariant = "edge" | "middle";

type Props = {
  game: PopularGame;
  isFeatured: boolean;
  tintVariant: TintVariant;
};

function CardInner({ game, tintVariant }: { game: PopularGame; tintVariant: TintVariant }) {
  return (
    <Box className="relative h-76 rounded-[10px] overflow-hidden bg-[#0C0C16]">
      {/* Game image — full bleed */}
      <Image
        src={game.image}
        alt={game.title}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />

      {/* Colour tint overlay — edge: #9C3BF6/purple, middle: #443BF6/indigo */}
      <Box
        className={cn(
          "absolute inset-0 pointer-events-none",
          tintVariant === "edge" ? "bg-[#9C3BF6]/5" : "bg-[#443BF6]/5"
        )}
      />

      {/* Dark gradient overlay — starts ~58% up the card, nearly opaque at bottom */}
      <Box className="absolute inset-x-0 bottom-0 h-44 bg-linear-to-b from-transparent via-[#0C0C16]/60 to-[#0C0C16] pointer-events-none" />

      {/* Badge */}
      <Box className="absolute top-0 right-0 z-10 flex items-center gap-1 p-2 rounded-bl-lg bg-linear-to-br from-blue-500 to-purple-600">
        <Text as="span" className="text-[10px] leading-none">
          {game.badge.emoji}
        </Text>
        <Text
          as="span"
          className="font-outfit font-bold text-[10px] uppercase tracking-[0.5px] text-white leading-none"
        >
          {game.badge.label}
        </Text>
      </Box>

      {/* Text — pinned to card bottom, always over gradient */}
      <Box className="absolute inset-x-0 bottom-0 z-10 px-4 py-3">
        <Heading
          as="h3"
          level={6}
          className="font-outfit font-bold text-[18px] leading-6 text-white line-clamp-2"
        >
          {game.title}
        </Heading>
        <Heading
          as="h3"
          level={6}
          className="font-outfit font-bold text-[18px] leading-6 text-white line-clamp-2"
        >
          {game.region}
        </Heading>

        <Text as="p" className="font-inter font-normal text-[12px] leading-4 text-[#3B82F6] mt-0.5">
          {game.subtitle}
        </Text>
      </Box>
    </Box>
  );
}

export default function PopularGameCard({ game, isFeatured, tintVariant }: Props): React.JSX.Element {
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const href = `/${locale}/checkout/${game.id}`;

  if (isFeatured) {
    return (
      <Box as="article" className="shrink-0 w-60">
        {/* 3px padding + rounded-[19px] outer = rounded-2xl (16px) inner fits flush */}
        <Link href={href} className="block p-0.75 rounded-[13px] bg-linear-to-b from-purple-600 to-blue-500">
          <CardInner game={game} tintVariant={tintVariant} />
        </Link>
      </Box>
    );
  }

  return (
    <Box as="article" className="shrink-0 w-60 rounded-[10px] border border-[#9333EA]/30">
      <Link href={href} className="block">
        <CardInner game={game} tintVariant={tintVariant} />
      </Link>
    </Box>
  );
}
