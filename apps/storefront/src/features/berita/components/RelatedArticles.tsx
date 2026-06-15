import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import ArticleCard from "@/features/berita/components/ArticleCard";
import type { Article } from "@/features/berita/types/article.type";

type Props = {
  articles: Article[];
  locale: string;
};

export default function RelatedArticles({ articles, locale }: Props): React.JSX.Element | null {
  const { t } = useTranslation("berita");

  if (articles.length === 0) return null;

  return (
    <Box as="section" className="w-full py-12 border-t border-white/8">
      <Box className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-8">
        {/* Section heading with thick blue accent bars */}
        <Box className="flex items-center justify-center gap-4">
          <Box className="w-8 h-[3px] rounded-full bg-[#3B82F6] shrink-0" />
          <Text
            as="span"
            className="font-outfit font-bold text-[16px] md:text-[18px] tracking-[1px] text-white uppercase text-center shrink-0"
          >
            {t("detail.related")}
          </Text>
          <Box className="w-8 h-[3px] rounded-full bg-[#3B82F6] shrink-0" />
        </Box>

        {/* 3-column grid of related article cards */}
        <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
