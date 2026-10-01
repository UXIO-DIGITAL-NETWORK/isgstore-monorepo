import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BeritaHeader from "@/features/berita/components/BeritaHeader";
import CategoryFilter from "@/features/berita/components/CategoryFilter";
import ArticleCard from "@/features/berita/components/ArticleCard";
import BeritaPagination from "@/features/berita/components/BeritaPagination";
import { useBerita } from "@/features/berita/hooks/useBerita";

function BeritaGridSkeleton(): React.JSX.Element {
  return (
    <Box aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-72 w-full rounded-2xl" />
      ))}
    </Box>
  );
}

export default function BeritaPage(): React.JSX.Element {
  const { t } = useTranslation("berita");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const {
    pagedArticles,
    categories,
    activeCategory,
    setActiveCategory,
    currentPage,
    setCurrentPage,
    totalPages,
    query,
  } = useBerita();

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8">
        {/* Page header: title + subtitle */}
        <BeritaHeader />

        {/* Category filter pills */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Article grid */}
        <QueryState
          query={query}
          skeleton={<BeritaGridSkeleton />}
          isEmpty={(response) => response.data.data.length === 0}
          empty={<EmptyState title={t("empty")} />}
        >
          {() => (
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pagedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </Box>
          )}
        </QueryState>

        {/* Pagination */}
        <BeritaPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Box>

      <Footer />
    </Box>
  );
}
