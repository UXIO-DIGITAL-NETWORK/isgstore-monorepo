import React from "react";
import { Box } from "@/components/common/Box";

type Props = {
  count: number;
  current: number;
  onDotClick: (idx: number) => void;
};

export default function CarouselDots({ count, current, onDotClick }: Props): React.JSX.Element {
  return (
    <Box className="flex items-center justify-center gap-1.5 mt-3">
      {Array.from({ length: count }).map((_, idx) => (
        <Box
          key={idx}
          as="button"
          type="button"
          onClick={() => onDotClick(idx)}
          aria-label={`Slide ${idx + 1}`}
          className={`h-[5px] rounded-full cursor-pointer outline-none transition-all duration-300 ${
            idx === current ? "bg-violet-500 w-6" : "bg-white/25 hover:bg-white/45 w-[5px]"
          }`}
        />
      ))}
    </Box>
  );
}
