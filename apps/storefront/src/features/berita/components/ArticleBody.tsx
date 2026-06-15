import React from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import type { ArticleSection } from "@/features/berita/types/article.type";

type Props = {
  sections: ArticleSection[];
};

export default function ArticleBody({ sections }: Props): React.JSX.Element {
  return (
    <Box className="flex flex-col gap-5">
      {sections.map((section, idx) => (
        <Box key={idx} className="flex flex-col gap-2.5">
          {section.heading && (
            <Heading
              as="h2"
              level={5}
              className="font-outfit font-bold text-[17px] leading-snug text-white"
            >
              {section.heading}
            </Heading>
          )}
          {section.paragraphs.map((para, pIdx) => (
            <Text
              key={pIdx}
              as="p"
              className="font-inter text-[14px] leading-[1.75] text-white/70"
            >
              {para}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}
