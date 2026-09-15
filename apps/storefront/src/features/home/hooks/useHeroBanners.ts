import { useQuery } from "@tanstack/react-query";
import { storefrontService } from "@/services/storefront.service";
import { BANNERS } from "@/features/home/data/heroBanner.data";
import type { HeroBannerItem } from "@/features/home/types/heroBanner.type";

/**
 * Hero slides from the CMS, falling back to the bundled artwork.
 *
 * The fallback is deliberate: the hero is the first thing above the fold, and
 * a storefront whose banners have not been uploaded yet should still look
 * finished rather than showing an empty carousel.
 */
export function useHeroBanners(): HeroBannerItem[] {
  const { data } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const response = await storefrontService.banners();
      return response.data.map<HeroBannerItem>((banner) => ({
        src: banner.image_url,
        alt: banner.name,
        link: banner.link,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return data && data.length > 0 ? data : BANNERS;
}
