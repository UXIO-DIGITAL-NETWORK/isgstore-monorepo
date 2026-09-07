import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import type { PolicySection as PolicySectionType } from "@/features/privacy-policy/types/privacy-policy.type";

export default function PolicySection({
  heading,
  paragraphs,
  bullets,
}: PolicySectionType): React.JSX.Element {
  return (
    <Box className="mb-2">
      {/* Section heading */}
      <Box
        as="h2"
        className="font-outfit font-bold text-[18px] md:text-[20px] text-white mt-10 mb-3 leading-snug"
      >
        {heading}
      </Box>

      {/* Paragraphs */}
      {paragraphs.map((para, idx) => (
        <Text
          key={idx}
          as="p"
          className="font-inter text-[14px] md:text-[15px] text-white/55 leading-[1.85] mb-4"
        >
          {para}
        </Text>
      ))}

      {/* Optional bullet list */}
      {bullets && bullets.length > 0 && (
        <Box
          as="ul"
          className="list-disc pl-6 flex flex-col gap-2 mb-4"
        >
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
