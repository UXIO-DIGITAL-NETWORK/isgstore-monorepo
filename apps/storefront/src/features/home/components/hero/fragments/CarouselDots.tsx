import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";

type Props = {
  count: number;
  current: number;
  onDotClick: (idx: number) => void;
};

export default function CarouselDots({ count, current, onDotClick }: Props): React.JSX.Element {
  const { t } = useTranslation("home");
  return (
    <Box className="flex items-center justify-center gap-1.5 mt-3">
      {Array.from({ length: count }).map((_, idx) => (
        // The button carries a larger (transparent) hit area than the dot so it
        // meets the minimum touch-target size; the negative margin keeps the
        // visible spacing unchanged.
        <Box
          key={idx}
          as="button"
          type="button"
          onClick={() => onDotClick(idx)}
          aria-label={t("hero.slide", { number: idx + 1 })}
          className="p-2.5 -m-2.5 rounded-full cursor-pointer outline-none"
        >
          <Box
            className={`block h-[5px] rounded-full transition-all duration-300 ${
              idx === current ? "bg-[rgb(208,201,129)] w-6" : "bg-white/25 hover:bg-white/45 w-[5px]"
            }`}
          />
        </Box>
      ))}
    </Box>
  );
}
