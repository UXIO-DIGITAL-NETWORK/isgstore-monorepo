import React from "react";
import { useTranslation } from "react-i18next";
import { Quote } from "lucide-react";

import { Box } from "@/components/common/Box";
import { ErrorState } from "@/components/common/ErrorState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import { useTestimonials } from "@/features/home/hooks/useTestimonials";
import TestimonialCard from "./fragments/TestimonialCard";

function TestimoniSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-44 w-full rounded-2xl" />
      ))}
    </Box>
  );
}

/**
 * What customers say, as the admin panel wrote it.
 *
 * Renders nothing at all when the table is empty, rather than a heading over an
 * empty grid — the section is an assertion about the business, and there is
 * nothing to assert until someone writes one. A failed request is not the same
 * as an empty table, though, so that gets a retry-able banner instead of
 * vanishing.
 */
export default function Testimoni(): React.JSX.Element {
  const { t } = useTranslation("home");
  const query = useTestimonials();

  if (query.isSuccess && (query.data?.length ?? 0) === 0) return <></>;

  return (
    <Box className="w-full pt-6 pb-8 md:pt-8 md:pb-12">
      <Box className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-6">
        <Box className="flex flex-col gap-1.5">
          <Box className="flex items-center gap-2.5">
            <Quote className="h-5 w-5 shrink-0 text-highlight" />
            <Box
              as="h2"
              className="font-outfit text-2xl font-bold uppercase tracking-wide text-white"
            >
              {t("testimoni.title")}
            </Box>
          </Box>
          <Text as="p" className="font-inter text-sm text-[#767676]">
            {t("testimoni.subtitle")}
          </Text>
        </Box>

        <QueryState
          query={query}
          skeleton={<TestimoniSkeleton />}
          error={<ErrorState variant="inline" onRetry={() => void query.refetch()} />}
        >
          {(testimonials) => (
            <Box className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </Box>
          )}
        </QueryState>
      </Box>
    </Box>
  );
}
