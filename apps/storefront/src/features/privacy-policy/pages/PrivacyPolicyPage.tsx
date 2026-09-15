import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "@tanstack/react-router";
import { Box } from "@/components/common/Box";
import { usePageQuery } from "@/hooks/useContentQuery";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import PrivacyPolicyHeader from "@/features/privacy-policy/components/PrivacyPolicyHeader";
import StaticPageSection from "@/components/common/StaticPageSection";
import type { PolicySection as PolicySectionType } from "@/features/privacy-policy/types/privacy-policy.type";

/** Matches the slug the API seeds this page under. */
const PAGE_SLUG = "kebijakan-privasi";

export default function PrivacyPolicyPage(): React.JSX.Element {
  const { t } = useTranslation("privacyPolicy");
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };
  const { data } = usePageQuery(PAGE_SLUG, locale);

  // The bundled copy stands in until the request lands and stays if it fails —
  // a policy page must never render blank.
  const page = data?.data;
  const intro = page?.intro?.length ? page.intro : (t("intro", { returnObjects: true }) as string[]);
  const sections = page?.sections?.length
    ? (page.sections as PolicySectionType[])
    : (t("sections", { returnObjects: true }) as PolicySectionType[]);

  return (
    <Box className="min-h-dvh bg-[#0A0A0C]">
      <Navbar />

      <Box className="max-w-6xl mx-auto px-4 md:px-8 pb-20">
        {/* Page title + accent */}
        <PrivacyPolicyHeader />

        {/* Intro paragraphs */}
        <Box className="flex flex-col gap-4">
          {intro.map((paragraph, idx) => (
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
        {sections.map((section) => (
          <StaticPageSection
            key={section.heading}
            heading={section.heading}
            paragraphs={section.paragraphs}
            bullets={section.bullets}
          />
        ))}
      </Box>

      <Footer />
    </Box>
  );
}
