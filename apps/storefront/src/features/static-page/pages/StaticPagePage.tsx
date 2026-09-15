import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
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
  const { data, isPending } = usePageQuery(slug, locale);

  const page = data?.data;

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        {isPending ? (
          <Text as="p" className="pt-16 font-inter text-[14px] text-white/40">
            {t("a11y.loading")}
          </Text>
        ) : !page ? (
          <Box className="pt-16 flex flex-col gap-3">
            <Box
              as="h1"
              className="font-outfit font-bold text-[28px] md:text-[34px] text-white leading-tight"
            >
              {t("notFound.title")}
            </Box>
            <Text as="p" className="font-inter text-[14px] md:text-[15px] text-white/55 leading-[1.85]">
              {t("notFound.description")}
            </Text>
          </Box>
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
              <Box className="w-16 h-[3px] rounded-full bg-linear-to-r from-[#3B82F6] to-[#9234EA] mt-3 mb-2" />

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
