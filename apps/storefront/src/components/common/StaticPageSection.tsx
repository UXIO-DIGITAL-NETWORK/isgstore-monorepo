import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";

interface StaticPageSectionProps {
  /** Optional: a section may be paragraphs only. */
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

/**
 * One section of a CMS page — the shape `GET /v1/storefront/pages/{slug}`
 * returns and the same shape the bundled locale JSON falls back to.
 *
 * Shared rather than owned by one screen: the privacy policy and the generic
 * page route render the identical structure, and two copies would drift the
 * moment one of them learned about, say, a nested list.
 */
export default function StaticPageSection({
  heading,
  paragraphs,
  bullets,
}: StaticPageSectionProps): React.JSX.Element {
  return (
    <Box className="mb-2">
      {/* A page may legitimately have no heading for a section, in which case
          an empty <h2> would announce a heading that says nothing. */}
      {heading && (
        <Box
          as="h2"
          className="font-outfit font-bold text-[18px] md:text-[20px] text-white mt-10 mb-3 leading-snug"
        >
          {heading}
        </Box>
      )}

      {paragraphs.map((para, idx) => (
        <Text
          key={idx}
          as="p"
          className="font-inter text-[14px] md:text-[15px] text-white/55 leading-[1.85] mb-4"
        >
          {para}
        </Text>
      ))}

      {bullets && bullets.length > 0 && (
        <Box as="ul" className="list-disc pl-6 flex flex-col gap-2 mb-4">
          {bullets.map((bullet, idx) => (
            <Box
              key={idx}
              as="li"
              className="font-inter text-[14px] md:text-[15px] text-white/55 leading-[1.85]"
            >
              {bullet}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
