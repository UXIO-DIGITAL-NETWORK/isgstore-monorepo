import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import type { Article } from "@/features/berita/types/article.type";

type Props = {
  article: Article;
};

function CardInner({ article }: { article: Article }) {
  return (
    <Box className="relative h-72 sm:h-86 md:h-96 w-full rounded-2xl overflow-hidden">
      {/* Full-bleed image */}
      <Image
        src={article.image}
        alt={article.title}
        objectFit="cover"
        className="absolute inset-0 w-full h-full"
      />

      {/* Dark purple gradient overlay — transparent top → solid bottom */}
      <Box className="absolute inset-0 bg-linear-to-t from-[#0B051D] via-[#0B051D]/80 to-transparent" />

      {/* Content overlaid at bottom */}
      <Box className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 px-5 pb-6">
        <Text
          as="span"
          className="inline-block self-start font-outfit font-bold text-[11px] leading-none tracking-[0.5px] text-white uppercase px-3 py-1.5 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#6366F1]"
        >
          {article.category}
        </Text>
        <Heading
          as="h3"
          level={5}
          className="font-outfit font-bold text-[20px] leading-[1.3] text-white line-clamp-2"
        >
          {article.title}
        </Heading>
        <Text as="span" className="font-inter font-normal text-[13px] leading-none text-[#9AA5B4]">
          {article.date}
        </Text>
      </Box>
    </Box>
  );
}

export default function ArticleCard({ article }: Props): React.JSX.Element {
  return (
    <Box as="article" className="rounded-2xl border border-[#9333EA]/50 overflow-hidden">
      <CardInner article={article} />
    </Box>
  );
}
