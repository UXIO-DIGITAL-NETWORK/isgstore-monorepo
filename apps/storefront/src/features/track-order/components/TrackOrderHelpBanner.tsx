import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";

export default function TrackOrderHelpBanner(): React.JSX.Element {
  const { t } = useTranslation("trackOrder");

  return (
    <Box className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-4">
      <Box className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <Box className="flex flex-col gap-0.5">
          <Text as="p" className="font-outfit font-semibold text-[14px] text-white">
            {t("help.title")}
          </Text>
          <Text as="p" className="font-inter text-[13px] text-white/55 leading-snug">
            {t("help.bodyPrefix")}{" "}
            <Link
              href="#"
              className="text-[rgb(208,201,129)] hover:text-[rgb(208,201,129)] transition-colors underline underline-offset-2"
            >
              {t("help.customerCare")}
            </Link>{" "}
            {t("help.bodySuffix")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
