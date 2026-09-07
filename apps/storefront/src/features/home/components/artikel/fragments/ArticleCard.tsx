import React from "react";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Link } from "@/components/common/Link";
import type { Article } from "@/features/home/types/artikel.type";

type Props = {
  article: Article;
  isFeatured: boolean;
};

function CardInner({ article }: { article: Article }) {
  return (
    <Box className="relative h-72 sm:h-96 md:h-115 w-full rounded-2xl overflow-hidden">
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

export default function ArticleCard({ article, isFeatured }: Props): React.JSX.Element {
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const href = `/${locale}/berita/${article.slug}`;

  if (isFeatured) {
    return (
      <Box as="article" className="flex-1 min-w-0">
        <Link href={href} className="block p-0.5 h-full rounded-2xl bg-linear-to-br from-[#9B3BF6] to-[#3B82F6]">
          <CardInner article={article} />
        </Link>
      </Box>
    );
  }

  return (
    <Box as="article" className="flex-1 min-w-0 rounded-2xl border border-[#9333EA]/50">
      <Link href={href} className="block">
        <CardInner article={article} />
      </Link>
    </Box>
  );
}
