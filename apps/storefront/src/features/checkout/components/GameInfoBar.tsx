import React from "react";
import { useTranslation } from "react-i18next";
import { Zap, ShieldCheck, BadgeCheck } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import type { GameInfo } from "@/features/checkout/types/checkout.type";

interface Props {
  game: GameInfo;
}

export default function GameInfoBar({ game }: Props): React.JSX.Element {
  const { t } = useTranslation("checkout");

  return (
    <Box className="w-full bg-gradient-product-header border-t border-white/6">
      <Box className="relative max-w-6xl mx-auto px-4 md:px-8 py-5 md:pl-56">
        {/* Portrait game card — overlaps upward into the banner image, now bigger */}
        <Box className="hidden md:block absolute left-4 md:left-8 top-36 md:-top-20 w-27 md:w-39 aspect-3/4 rounded-2xl overflow-hidden border border-accent/40 shadow-glow-accent z-10">
          <img
            src={game.thumbnail}
            alt={game.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </Box>

        {/* Game info: title, region, merged badge */}
        <Box className="flex flex-col gap-2">
          <Heading
            as="h1"
            className="font-outfit font-bold text-[22px] md:text-[32px] text-white leading-tight"
          >
            {game.name}
          </Heading>

          <Box className="flex items-center gap-1.5">
            <Box as="span" className="w-2 h-2 rounded-full bg-success shrink-0" />
            <Text as="span" className="font-inter text-[13px] text-white/55">
              {game.region}
            </Text>
          </Box>

          {/* Single merged trust badge pill with 3 items separated by dots */}
          <Box className="inline-flex items-center gap-0 mt-1 px-2 rounded-full border border-white/10 bg-white/4 overflow-hidden w-fit">
            <Box className="flex items-center gap-1.5 px-3 py-1.5">
              <Zap size={13} className="text-accent shrink-0" strokeWidth={2.2} />
              <Text
                as="span"
                className="font-outfit text-[11px] font-semibold uppercase tracking-wide text-white/65 leading-none whitespace-nowrap"
              >
                {t("gameInfo.badges.fastProcess")}
              </Text>
            </Box>

            <Box as="span" className="w-px h-4 bg-white/10 shrink-0" />

            <Box className="flex items-center gap-1.5 px-3 py-1.5">
              <ShieldCheck size={13} className="text-accent shrink-0" strokeWidth={2.2} />
              <Text
                as="span"
                className="font-outfit text-[11px] font-semibold uppercase tracking-wide text-white/65 leading-none whitespace-nowrap"
              >
                {t("gameInfo.badges.safe")}
              </Text>
            </Box>

            <Box as="span" className="w-px h-4 bg-white/10 shrink-0" />

            <Box className="flex items-center gap-1.5 px-3 py-1.5">
              <BadgeCheck size={13} className="text-accent shrink-0" strokeWidth={2.2} />
              <Text
                as="span"
                className="font-outfit text-[11px] font-semibold uppercase tracking-wide text-white/65 leading-none whitespace-nowrap"
              >
                {t("gameInfo.badges.official")}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
