import React from "react";
import { cva } from "class-variance-authority";
import { User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Image } from "@/components/common/Image";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { LeaderboardEntry } from "@/features/leaderboard/types/leaderboard.type";
import icon1st from "@/assets/images/decoration/icon_leaderboard_1st.png";
import icon2nd from "@/assets/images/decoration/icon_leaderboard_2nd.png";
import icon3rd from "@/assets/images/decoration/icon_leaderboard_3rd.png";

const RANK_ICONS: Record<1 | 2 | 3, string> = {
  1: icon1st,
  2: icon2nd,
  3: icon3rd,
};

const cardVariants = cva(
  "relative flex flex-col items-center gap-3 rounded-2xl border p-5 pt-12 transition-all",
  {
    variants: {
      rank: {
        1: "bg-[#1E1500] border-[#E5A000]",
        2: "bg-[#0D1A2E] border-[#3B82F6]/60",
        3: "bg-[#1A120A] border-[#C97B3C]/60",
      },
    },
  }
);

const amountVariants = cva("font-plex font-bold text-[18px] leading-none", {
  variants: {
    rank: {
      1: "text-[#E5A000]",
      2: "text-[#3B82F6]",
      3: "text-[#C97B3C]",
    },
  },
});

interface Props {
  entry: LeaderboardEntry;
  isHighlighted?: boolean;
}

export default function LeaderboardPodiumCard({ entry, isHighlighted = false }: Props): React.JSX.Element {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const rank = entry.rank as 1 | 2 | 3;

  return (
    <Box
      className={cn(
        cardVariants({ rank }),
        isHighlighted && "scale-[1.04] shadow-[0_0_32px_rgba(229,160,0,0.18)]"
      )}
    >
      {/* Trophy icon floating above card */}
      <Box className="absolute -top-16 left-1/2 -translate-x-1/2">
        <Image
          src={RANK_ICONS[rank]}
          alt={`Rank ${rank} trophy`}
          priority="eager"
          objectFit="contain"
          className="w-26 h-26"
        />
      </Box>

      {/* Avatar circle */}
      <Box className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 border border-white/15">
        <User size={26} className="text-white/60" />
      </Box>

      {/* Player name */}
      <Text as="p" className="font-inter text-[13px] text-white/85 text-center leading-snug">
        {entry.playerName}
      </Text>

      {/* Total amount */}
      <Text as="p" className={cn(amountVariants({ rank }))}>
        {formatCurrency(entry.totalAmount, locale)}
      </Text>
    </Box>
  );
}
