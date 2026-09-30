import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { useLatestArticlesQuery } from "@/hooks/useArticlesQuery";
import { toHomeArticle } from "@/lib/articles";
import ArticleCard from "./fragments/ArticleCard";

const LATEST_COUNT = 3;

function ArtikelSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="flex flex-col md:flex-row gap-6">
      {Array.from({ length: LATEST_COUNT }).map((_, index) => (
        <Skeleton key={index} className="h-72 sm:h-96 md:h-115 flex-1 rounded-2xl" />
      ))}
    </Box>
  );
}

export default function ArtikelTerbaru(): React.JSX.Element {
  const { t } = useTranslation("home");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const query = useLatestArticlesQuery(LATEST_COUNT, locale);
  const articles = (query.data?.data.data ?? []).map((model) => toHomeArticle(model, locale));

  return (
    <Box as="section" className="w-full py-16 md:py-20">
      <Box className="max-w-6xl mx-auto px-4 md:px-8">

        {/* Section heading */}
        <Box className="flex flex-col items-center gap-3 mb-12">
          <Box className="flex flex-wrap items-center justify-center gap-4">
            <Box className="w-8 h-0.5 rounded-full bg-[rgb(67,86,32)] shrink-0 hidden sm:block" />
            <Heading
              as="h2"
              level={3}
              className="font-outfit font-bold text-[22px] md:text-[28px] leading-7 tracking-[-0.5px] text-white uppercase text-center"
            >
              {t("artikel.title")}
            </Heading>
            <Box className="w-8 h-0.5 rounded-full bg-[rgb(67,86,32)] shrink-0 hidden sm:block" />
          </Box>
          <Text as="p" className="font-inter font-normal text-[15px] leading-5 text-[#697282]">
            {t("artikel.subtitle")}
          </Text>
        </Box>

        <QueryState
          query={query}
          skeleton={<ArtikelSkeleton />}
          isEmpty={(response) => response.data.data.length === 0}
          empty={
            <EmptyState
              compact
              title={t("artikel.empty.title")}
              description={t("artikel.empty.description")}
            />
          }
        >
          {() => (
            /* 3-card flex row */
            <Box className="flex flex-col md:flex-row gap-6">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  isFeatured={index === 0}
                />
              ))}
            </Box>
          )}
        </QueryState>

        {/* CTA button */}
        <Box className="flex justify-center mt-10">
          <Link
            href={`/${locale}/berita`}
            className="flex items-center gap-2.5 px-8 h-11.5 rounded-full bg-transparent border border-[rgb(208,201,129)] cursor-pointer no-underline"
          >
            <Text
              as="span"
              className="font-inter font-bold text-[12px] leading-none tracking-[1.2px] text-[rgb(208,201,129)] uppercase"
            >
              {t("artikel.viewAll")}
            </Text>
            <ChevronDown className="w-4 h-4 text-[rgb(208,201,129)]" />
          </Link>
        </Box>

      </Box>
    </Box>
  );
}
