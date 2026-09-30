import React from "react";
import { useParams } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Heading } from "@/components/common/Heading";
import { Image } from "@/components/common/Image";
import { Skeleton } from "@/components/common/Skeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import Breadcrumb from "@/features/berita/components/Breadcrumb";
import ArticleMeta from "@/features/berita/components/ArticleMeta";
import ArticleBody from "@/features/berita/components/ArticleBody";
import ShareBar from "@/features/berita/components/ShareBar";
import RelatedArticles from "@/features/berita/components/RelatedArticles";
import { useArticleDetail } from "@/features/berita/hooks/useArticleDetail";

function ArticleSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="max-w-3xl mx-auto px-4 md:px-8 py-10 flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-5/6" />
      <Skeleton className="h-4 w-52" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Box className="flex flex-col gap-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </Box>
    </Box>
  );
}

export default function ArticleDetailPage(): React.JSX.Element {
  const { slug = "", locale = "id" } = useParams({ strict: false }) as {
    slug?: string;
    locale?: string;
  };
  const { t } = useTranslation("berita");
  const { article, related, sections, query } = useArticleDetail(slug);

  // The article arrives asynchronously, so "not found" must wait for the request
  // to settle — otherwise every visit flashes it before the content.
  if (query.isPending && query.fetchStatus !== "idle") {
    return (
      <Box className="min-h-dvh bg-[rgb(0,0,0)]">
        <Navbar />
        <ArticleSkeleton />
        <Footer />
      </Box>
    );
  }

  if (query.isError) {
    return (
      <Box className="min-h-dvh bg-[rgb(0,0,0)]">
        <Navbar />
        <Box className="max-w-3xl mx-auto px-4 md:px-8 py-24">
          <ErrorState onRetry={() => void query.refetch()} />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (!article) {
    return (
      <Box className="min-h-dvh bg-[rgb(0,0,0)]">
        <Navbar />
        <Box className="max-w-3xl mx-auto px-4 md:px-8 py-24">
          <EmptyState title={t("detail.notFound")} />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
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
        <ArticleBody sections={sections} />

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
