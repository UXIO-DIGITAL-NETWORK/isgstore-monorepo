import { useQuery } from "@tanstack/react-query";
import { storefrontService } from "@/services/storefront.service";
import { BANNERS } from "@/features/home/data/heroBanner.data";
import type { HeroBannerItem } from "@/features/home/types/heroBanner.type";

/**
 * Hero slides from the CMS, falling back to the bundled artwork.
 *
 * The fallback is deliberate: the hero is the first thing above the fold, and
 * a storefront whose banners have not been uploaded yet should still look
 * finished rather than showing an empty carousel. `select` applies it on a
 * successful-but-empty response; the caller applies it again on failure, so the
 * hero always has something to show.
 *
 * Returns the query so the banner can render a skeleton on first load.
 */
export function useHeroBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () =>
      (await storefrontService.banners()).data.map<HeroBannerItem>((banner) => ({
        src: banner.image_url,
        alt: banner.name,
        link: banner.link,
      })),
    select: (data) => (data && data.length > 0 ? data : BANNERS),
    staleTime: 5 * 60 * 1000,
  });
}
