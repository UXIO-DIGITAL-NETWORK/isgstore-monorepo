import React from "react";
import { Box } from "@/components/common/Box";
import { GAP_PX, SIDE_VISIBLE } from "@/features/home/constants/heroBanner";
import { useHeroCarousel } from "@/features/home/hooks/useHeroCarousel";
import BannerNavArrow from "./fragments/BannerNavArrow";
import CarouselDots from "./fragments/CarouselDots";
import { BANNERS } from "@/features/home/data/heroBanner.data";

export default function HeroBanner(): React.JSX.Element {
  const { current, trackRef, hasPeek, slideWidth, goTo } = useHeroCarousel(BANNERS.length);

  return (
    <Box className="w-full bg-[#0B0A11] pt-4 pb-5 md:pt-8 md:pb-9">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Carousel viewport */}
        <Box
          ref={trackRef}
          className="relative w-full overflow-hidden rounded-xl md:rounded-2xl"
          style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", transform: "translateZ(0)" }}
        >
          {hasPeek && slideWidth > 0 ? (
            /* Peek mode: translate-based sliding track */
            <Box
              className="flex"
              style={{
                gap: `${GAP_PX}px`,
                marginLeft: `${SIDE_VISIBLE}px`,
                transform: `translateX(-${current * (slideWidth + GAP_PX)}px)`,
                transition: "transform 500ms cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
              }}
            >
              {BANNERS.map((banner, idx) => {
                const isActive = idx === current;
                const slideStyle = {
                  width: `${slideWidth}px`,
                  aspectRatio: "1110 / 400" as const,
                  opacity: isActive ? 1 : 0.45,
                  transform: isActive ? "scale(1)" : "scale(0.96)",
                  transition: "opacity 400ms ease, transform 400ms ease",
                  WebkitMaskImage: "-webkit-radial-gradient(white, black)",
                  transformOrigin: "center center",
                };

                if (isActive) {
                  return (
                    <Box
                      key={idx}
                      className="shrink-0 rounded-xl md:rounded-2xl overflow-hidden"
                      style={slideStyle}
                    >
                      <img
                        src={banner.src}
                        alt={banner.alt}
                        className="w-full h-full object-cover"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </Box>
                  );
                }

                return (
                  <Box
                    key={idx}
                    as="button"
                    type="button"
                    onClick={() => goTo(idx)}
                    aria-label={banner.alt}
                    className="shrink-0 rounded-xl md:rounded-2xl overflow-hidden outline-none cursor-pointer"
                    style={slideStyle}
                  >
                    <img
                      src={banner.src}
                      alt={banner.alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Box>
                );
              })}
            </Box>
          ) : (
            /* Simple mode: opacity crossfade */
            <Box
              style={{ aspectRatio: "1300 / 400" }}
              className="relative w-full"
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
            </Box>
          )}

          <BannerNavArrow
            direction="prev"
            hasPeek={hasPeek}
            onClick={() => goTo((current - 1 + BANNERS.length) % BANNERS.length)}
          />
          <BannerNavArrow
            direction="next"
            hasPeek={hasPeek}
            onClick={() => goTo((current + 1) % BANNERS.length)}
          />
        </Box>

        <CarouselDots
          count={BANNERS.length}
          current={current}
          onDotClick={goTo}
        />
      </Box>
    </Box>
  );
}
