import React from "react";
import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import PrivacyPolicyHeader from "@/features/privacy-policy/components/PrivacyPolicyHeader";
import PolicySection from "@/features/privacy-policy/components/PolicySection";
import type { PolicySection as PolicySectionType } from "@/features/privacy-policy/types/privacy-policy.type";

export default function PrivacyPolicyPage(): React.JSX.Element {
  const { t } = useTranslation("privacyPolicy");

  const intro = t("intro", { returnObjects: true }) as string[];
  const sections = t("sections", { returnObjects: true }) as PolicySectionType[];

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
          <PolicySection
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
