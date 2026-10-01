import React from "react";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { useSiteSettings, whatsappLink } from "@/hooks/useSiteSettings";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Holds the storefront behind a notice while `maintenance_mode` is on.
 *
 * Two deliberate escapes. The gate waits for the settings request to succeed,
 * so a slow or failed fetch shows the site rather than a maintenance screen the
 * operator never asked for — failing open is the right direction here. And a
 * signed-in session passes through: someone has to be able to verify the site
 * during the window, and locking staff out of the thing they are fixing is how
 * a maintenance flag stays on for a day.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { t } = useTranslation("common");
  const { flag, text, isLoaded } = useSiteSettings();
  const { token } = useAuthStore();

  if (!isLoaded || !flag("maintenance_mode") || token) {
    return <>{children}</>;
  }

  const whatsappHref = whatsappLink(text("contact_whatsapp"));
  const supportEmail = text("contact_email");

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Box className="w-16 h-16 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center">
        <Wrench className="w-7 h-7 text-white" />
      </Box>

      <Heading
        level={1}
        className="text-2xl font-bold text-white font-outfit"
      >
        {t("maintenance.title")}
      </Heading>

      <Text
        as="p"
        className="max-w-md text-sm leading-relaxed text-white/55 font-inter"
      >
        {t("maintenance.description")}
      </Text>

      <Box className="flex items-center gap-4">
        {whatsappHref && (
          <Link
            href={whatsappHref}
            target="_blank"
            className="text-sm font-semibold text-[rgb(208,201,129)] hover:text-[rgb(247,246,198)] transition-colors"
          >
            {t("footer.chatWhatsApp")}
          </Link>
        )}
        {supportEmail && (
          <Link
            href={`mailto:${supportEmail}`}
            className="text-sm font-semibold text-[rgb(208,201,129)] hover:text-[rgb(247,246,198)] transition-colors"
          >
            {supportEmail}
          </Link>
        )}
      </Box>
    </Box>
  );
}
