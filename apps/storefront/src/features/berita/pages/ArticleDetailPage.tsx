import React from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Image } from "@/components/common/Image";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import Breadcrumb from "@/features/berita/components/Breadcrumb";
import ArticleMeta from "@/features/berita/components/ArticleMeta";
import ArticleBody from "@/features/berita/components/ArticleBody";
import ShareBar from "@/features/berita/components/ShareBar";
import RelatedArticles from "@/features/berita/components/RelatedArticles";
import { useArticleDetail } from "@/features/berita/hooks/useArticleDetail";
import { ARTICLE_BODY } from "@/features/berita/data/articleContent";

export default function ArticleDetailPage(): React.JSX.Element {
  const { slug = "", locale = "id" } = useParams({ strict: false }) as {
    slug?: string;
    locale?: string;
  };
  const { t } = useTranslation("berita");
  const { article, related } = useArticleDetail(slug);

  if (!article) {
    return (
      <Box className="min-h-dvh bg-[#0A0A0C]">
        <Navbar />
        <Box className="max-w-3xl mx-auto px-4 md:px-8 py-24 flex items-center justify-center">
          <Text as="p" className="font-inter text-[15px] text-white/40">
            {t("detail.notFound")}
          </Text>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      {/* ── Article content (narrow column) ── */}
      <Box className="max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6">
        {/* Breadcrumb: Home › Berita › {category} */}
        <Breadcrumb category={article.category} locale={locale} />

        {/* Article title */}
        <Heading
          as="h1"
          level={2}
          className="font-outfit font-bold text-[28px] md:text-[36px] leading-[1.2] tracking-[-0.5px] text-white"
        >
          {article.title}
        </Heading>

        {/* Date + author meta */}
        <ArticleMeta date={article.date} author={article.author} />

        {/* Hero image */}
        <Box className="w-full rounded-2xl overflow-hidden aspect-video">
          <Image
            src={article.image}
            alt={article.title}
            objectFit="cover"
            className="w-full h-full"
          />
        </Box>

        {/* Article body sections */}
        <ArticleBody sections={ARTICLE_BODY} />

        {/* Divider */}
        <Box className="border-t border-white/10" />

        {/* Share bar */}
        <ShareBar title={article.title} />
      </Box>

      {/* ── Related articles (full-width section) ── */}
      <RelatedArticles articles={related} locale={locale} />

      <Footer />
    </Box>
  );
}
