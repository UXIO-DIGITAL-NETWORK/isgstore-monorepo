import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import BeritaHeader from "@/features/berita/components/BeritaHeader";
import CategoryFilter from "@/features/berita/components/CategoryFilter";
import ArticleCard from "@/features/berita/components/ArticleCard";
import BeritaPagination from "@/features/berita/components/BeritaPagination";
import { useBerita } from "@/features/berita/hooks/useBerita";
import { BERITA_CATEGORIES } from "@/features/berita/data/categories";

export default function BeritaPage(): React.JSX.Element {
  const { t } = useTranslation("berita");
  const {
    pagedArticles,
    activeCategory,
    setActiveCategory,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useBerita();

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8">
        {/* Page header: title + subtitle */}
        <BeritaHeader />

        {/* Category filter pills */}
        <CategoryFilter
          categories={BERITA_CATEGORIES}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        {/* Article grid */}
        {pagedArticles.length > 0 ? (
          <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </Box>
        ) : (
          <Box className="flex items-center justify-center py-20">
            <Text as="p" className="font-inter text-[15px] text-white/40">
              {t("empty")}
            </Text>
          </Box>
        )}

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
