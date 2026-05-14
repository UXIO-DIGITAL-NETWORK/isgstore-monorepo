import React from "react";
import { Box } from "@/components/common/Box";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SIDE_VISIBLE, GAP_PX } from "@/features/home/constants/heroBanner";

type Props = {
  direction: "prev" | "next";
  hasPeek: boolean;
  onClick: () => void;
};

export default function BannerNavArrow({ direction, hasPeek, onClick }: Props): React.JSX.Element {
  const isPrev = direction === "prev";
  const offset = hasPeek ? `${SIDE_VISIBLE + GAP_PX}px` : "12px";

  return (
    <Box
      as="button"
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Banner sebelumnya" : "Banner berikutnya"}
      className="absolute top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95"
      style={{ [isPrev ? "left" : "right"]: offset }}
    >
      {isPrev ? (
        <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
      ) : (
        <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
      )}
    </Box>
  );
}
