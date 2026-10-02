import { useQuery } from "@tanstack/react-query";

import { storefrontService } from "@/services/storefront.service";

/**
 * What customers say, as the admin panel wrote it.
 *
 * These are editorial quotes, not purchase-linked reviews — the verified
 * reviews on a product page are `ratings` rows and stay there. Nothing is
 * bundled as a fallback: a storefront with no testimonials should show no
 * testimonial section rather than invented praise.
 *
 * Returns the query so the section can show a skeleton and a retry.
 */
export function useTestimonials() {
  return useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => (await storefrontService.testimonials()).data,
    select: (data) => data ?? [],
    staleTime: 5 * 60 * 1000,
  });
}
