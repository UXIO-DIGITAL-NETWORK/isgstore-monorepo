import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Skeleton } from "@/components/common/Skeleton";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import StaticPageSection from "@/components/common/StaticPageSection";
import { usePageQuery } from "@/hooks/useContentQuery";
import { formatDate } from "@/lib/format";

/**
 * Any page the admin panel publishes under "Halaman".
 *
 * The route is generic on purpose: the footer's policy links point at slugs the
 * API seeds (`syarat-ketentuan`, `kebijakan-refund`), and a bespoke component
 * per slug is how a link ends up pointing at nothing. The privacy policy keeps
 * its own route because it carries a bundled fallback — a policy page must
 * never render blank.
 *
 * Nothing is bundled here as copy: an unknown slug is a page an admin deleted or
 * never wrote, and inventing text for it would be worse than saying so.
 */
export default function StaticPagePage(): React.JSX.Element {
  const { t } = useTranslation("common");
  const { locale = "id", slug = "" } = useParams({ strict: false }) as { locale?: string; slug?: string };
  const pageQuery = usePageQuery(slug, locale);

  const page = pageQuery.data?.data;
  const isInitialLoading = pageQuery.isPending && pageQuery.fetchStatus !== "idle";

  return (
    <Box className="min-h-dvh bg-[rgb(0,0,0)]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        {isInitialLoading ? (
          <Box aria-busy="true" className="pt-12 flex flex-col gap-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </Box>
        ) : pageQuery.isError ? (
          <Box className="pt-12">
            <ErrorState onRetry={() => void pageQuery.refetch()} />
          </Box>
        ) : !page ? (
          <EmptyState title={t("notFound.title")} description={t("notFound.description")} />
        ) : (
          <>
            <Box className="pt-12 pb-8">
              <Box
                as="h1"
                className="font-outfit font-bold text-[32px] md:text-[40px] text-white leading-tight mb-2"
              >
                {page.title}
              </Box>

              {/* Gradient underline accent — same mark the policy page uses. */}
              <Box className="w-16 h-[3px] rounded-full bg-linear-to-r from-[rgb(67,86,32)] to-[rgb(208,201,129)] mt-3 mb-2" />

              {page.updated_at && (
                <Text as="p" className="font-inter text-[13px] text-white/40 mt-3 leading-none">
                  {t("staticPage.lastUpdated", { date: formatDate(page.updated_at, locale) })}
                </Text>
              )}
            </Box>

            {/* Intro paragraphs */}
            <Box className="flex flex-col gap-4">
              {page.intro.map((paragraph, idx) => (
                <Text
                  key={idx}
                  as="p"
                  className="font-inter text-[14px] md:text-[15px] text-white/55 leading-[1.85]"
                >
                  {paragraph}
                </Text>
              ))}
            </Box>

            {/* Content sections */}
            {page.sections.map((section, idx) => (
              <StaticPageSection
                key={section.heading ?? idx}
                heading={section.heading}
                paragraphs={section.paragraphs}
                bullets={section.bullets}
              />
            ))}
          </>
        )}
      </Box>

      <Footer />
    </Box>
  );
}
