import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";

type Props = {
  category: string;
  locale: string;
};

export default function Breadcrumb({ category, locale }: Props): React.JSX.Element {
  const { t } = useTranslation("berita");

  return (
    <Box className="flex items-center gap-1.5 flex-wrap">
      <Link
        href={`/${locale}`}
        className="font-inter text-[13px] text-white/50 hover:text-white/80 transition-colors no-underline"
      >
        {t("breadcrumb.home")}
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />

      <Link
        href={`/${locale}/berita`}
        className="font-inter text-[13px] text-white/50 hover:text-white/80 transition-colors no-underline"
      >
        {t("breadcrumb.news")}
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-white/30 shrink-0" />

      <Text as="span" className="font-inter text-[13px] text-white/80">
        {category}
      </Text>
    </Box>
  );
}
