import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import { Skeleton } from "@/components/common/Skeleton";
import { GAP_PX, SIDE_VISIBLE } from "@/features/home/constants/heroBanner";
import { useHeroCarousel } from "@/features/home/hooks/useHeroCarousel";
import { bannerHref } from "@/features/home/lib/bannerHref";
import { BANNERS } from "@/features/home/data/heroBanner.data";
import BannerNavArrow from "./fragments/BannerNavArrow";
import CarouselDots from "./fragments/CarouselDots";
import { useHeroBanners } from "@/features/home/hooks/useHeroBanners";

/**
 * A slide's image, wrapped in a link when the banner has somewhere to go.
 *
 * A banner with no link stays a plain image rather than an anchor that leads
 * nowhere — the admin panel leaves `link` empty for decorative artwork.
 */
function SlideImage({
  src,
  alt,
  href,
  className,
  loading,
}: {
  src: string;
  alt: string;
  href: string | null;
  className: string;
  loading: "eager" | "lazy";
}): React.JSX.Element {
  if (!href) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        loading={loading}
      />
    );
  }

  return (
    <Link
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      className="block w-full h-full cursor-pointer"
    >
      <Image
        src={src}
        alt={alt}
        className={className}
        loading={loading}
      />
    </Link>
  );
}

export default function HeroBanner(): React.JSX.Element {
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const query = useHeroBanners();
  // The bundled artwork stands in whenever the request has failed or come back
  // empty, so the hero is never a hole in the page.
  const banners = query.data ?? BANNERS;
  const { current, containerWidth, trackRef, hasPeek, slideWidth, goTo } = useHeroCarousel(banners.length);
  const isMobile = containerWidth > 0 && containerWidth < 768;

  if (query.isPending && query.fetchStatus !== "idle") {
    return (
      <Box aria-busy="true" className="w-full pt-4 pb-5 md:pt-8 md:pb-9">
        <Box className="max-w-6xl mx-auto md:px-8">
          <Skeleton className="aspect-video w-full md:aspect-13/4 md:rounded-2xl" />
        </Box>
      </Box>
    );
  }

  return (
    <Box className="w-full pt-4 pb-5 md:pt-8 md:pb-9">
      <Box className="max-w-6xl mx-auto md:px-8">
        {/* Carousel viewport */}
        <Box
          ref={trackRef}
          className="relative w-full overflow-hidden md:rounded-2xl"
          style={{ WebkitMaskImage: "-webkit-radial-gradient(white, black)", transform: "translateZ(0)" }}
        >
          {hasPeek && !isMobile && slideWidth > 0 ? (
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
              {banners.map((banner, idx) => {
                const isActive = idx === current;
                const slideStyle = {
                  width: `${slideWidth}px`,
                  asspectRatio: "1110 / 400" as const,
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
                      <SlideImage
                        src={banner.src}
                        alt={banner.alt}
                        href={bannerHref(banner.link, locale)}
                        className="w-full h-full object-cover"
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    </Box>
                  );
                }

                // A peeked slide stays the carousel's own control: clicking it
                // brings that banner forward. Following its link from here
                // would take the visitor somewhere they did not choose.
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
              className="relative w-full aspect-video md:aspect-13/4"
            >
              {banners.map((banner, idx) => (
                <Box
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <SlideImage
                    src={banner.src}
                    alt={banner.alt}
                    href={bannerHref(banner.link, locale)}
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
            onClick={() => goTo((current - 1 + banners.length) % banners.length)}
          />
          <BannerNavArrow
            direction="next"
            hasPeek={hasPeek}
            onClick={() => goTo((current + 1) % banners.length)}
          />
        </Box>

        <CarouselDots
          count={banners.length}
          current={current}
          onDotClick={goTo}
        />
      </Box>
    </Box>
  );
}
