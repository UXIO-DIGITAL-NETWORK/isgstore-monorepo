import React from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import type { Article } from "@/features/berita/types/article.type";

type Props = {
  article: Article;
  locale: string;
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

      {/* Dark green gradient overlay — transparent top → solid bottom */}
      <Box className="absolute inset-0 bg-linear-to-t from-[rgb(14,20,10)] via-[rgb(14,20,10)]/80 to-transparent" />

      {/* Content overlaid at bottom */}
      <Box className="absolute bottom-0 left-0 right-0 flex flex-col gap-3 px-5 pb-6">
        <Text
          as="span"
          className="inline-block self-start font-outfit font-bold text-[11px] leading-none tracking-[0.5px] text-white uppercase px-3 py-1.5 rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(39,53,15)]"
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

export default function ArticleCard({ article, locale }: Props): React.JSX.Element {
  return (
    <Link
      href={`/${locale}/berita/${article.slug}`}
      className="block rounded-2xl border border-[rgb(208,201,129)]/50 overflow-hidden hover:border-[rgb(208,201,129)] transition-colors no-underline"
    >
      <Box as="article">
        <CardInner article={article} />
      </Box>
    </Link>
  );
}
