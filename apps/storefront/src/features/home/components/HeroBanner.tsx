import React, { useState, useEffect, useRef } from "react";
import { Box } from "@/components/common/Box";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IMAGES } from "@/constants/images";

const BANNERS = [
  { src: IMAGES.BANNER_1, alt: "Welcome to TopupGame.ID – Top up semua game, harga murah" },
  { src: IMAGES.BANNER_2, alt: "Promo Top Up Spesial – Bonus hingga +20%" },
  { src: IMAGES.BANNER_3, alt: "Beli 1 Gratis 1 – Top Up Game Favoritmu" },
];

const AUTO_DELAY = 4500;

export default function HeroBanner(): React.JSX.Element {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setCurrent((prev) => (prev + 1) % BANNERS.length), AUTO_DELAY);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const goTo = (idx: number) => {
    setCurrent(idx);
    restartTimer();
  };

  const prev = () => goTo((current - 1 + BANNERS.length) % BANNERS.length);
  const next = () => goTo((current + 1) % BANNERS.length);

  return (
    <Box className="w-full bg-[#0B0A11] pt-4 pb-5 md:pt-8 md:pb-9">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        {/* ── Slide track ── */}
        <Box
          className="relative w-full overflow-hidden rounded-xl md:rounded-2xl"
          style={{ aspectRatio: "1110 / 400" }}
        >
          {BANNERS.map((banner, idx) => (
            <Box
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={banner.src}
                alt={banner.alt}
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </Box>
          ))}

          {/* ── Left arrow ── */}
          <Box
            as="button"
            type="button"
            onClick={prev}
            aria-label="Banner sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </Box>

          {/* ── Right arrow ── */}
          <Box
            as="button"
            type="button"
            onClick={next}
            aria-label="Banner berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/40 hover:bg-black/65 backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer outline-none active:scale-95"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </Box>
        </Box>

        {/* ── Dot indicators ── */}
        <Box className="flex items-center justify-center gap-1.5 mt-3">
          {BANNERS.map((_, idx) => (
            <Box
              key={idx}
              as="button"
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-[5px] rounded-full cursor-pointer outline-none transition-all duration-300 ${
                idx === current ? "bg-violet-500 w-6" : "bg-white/25 hover:bg-white/45 w-[5px]"
              }`}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
