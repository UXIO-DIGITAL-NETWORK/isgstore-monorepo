import { useQuery } from "@tanstack/react-query";

import { storefrontService, type TestimonialModel } from "@/services/storefront.service";

/**
 * What customers say, as the admin panel wrote it.
 *
 * These are editorial quotes, not purchase-linked reviews — the verified
 * reviews on a product page are `ratings` rows and stay there. Nothing is
 * bundled as a fallback: a storefront with no testimonials should show no
 * testimonial section rather than invented praise.
 */
export function useTestimonials(): TestimonialModel[] {
  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const response = await storefrontService.testimonials();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return data ?? [];
}
