import { useQuery } from "@tanstack/react-query";

import { contentService } from "@/services/content.service";

/**
 * FAQ and static-page reads.
 *
 * Both surfaces keep their bundled locale JSON as a fallback at the call site:
 * a help or policy page that renders blank because a request failed is worse
 * than one showing slightly stale copy. Same reasoning as the hero banner's
 * bundled-artwork fallback.
 */

export const useFaqsQuery = (locale: string) =>
  useQuery({
    queryKey: ["faqs", locale],
    queryFn: () => contentService.faqs(locale),
  });

export const usePageQuery = (slug: string, locale: string) =>
  useQuery({
    queryKey: ["pages", slug, locale],
    queryFn: () => contentService.page(slug, locale),
    enabled: Boolean(slug),
    // A missing page is a 404 the API answers deliberately; retrying it just
    // delays the fallback.
    retry: false,
  });
