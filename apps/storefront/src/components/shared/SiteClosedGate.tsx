import React, { useEffect, useState } from "react";
import { CalendarX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Link } from "@/components/common/Link";
import { useSiteSettings, whatsappLink } from "@/hooks/useSiteSettings";
import { getSiteClosure, subscribeSiteClosure, type SiteClosure } from "@/lib/siteClosed";

/**
 * Shown when the API reports this deployment is switched off.
 *
 * Distinct from `MaintenanceGate` in every way that matters, and the two must
 * not be merged. Maintenance is the operator's own flag: it fails open, any
 * signed-in session passes through, and it says "back shortly". This one is the
 * server refusing every public request, and no session gets past it — because
 * the server is not letting anyone past either.
 *
 * The copy stays vague about the reason on purpose. A customer landing here has
 * no stake in the shop's billing arrangement, and "this shop has not paid" is
 * both unkind and not theirs to know; the site's own admin sees the real
 * message in their panel, which is still reachable.
 */
export function SiteClosedGate({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { t } = useTranslation("common");
  const { text } = useSiteSettings();
  const [closure, setClosure] = useState<SiteClosure | null>(getSiteClosure);

  useEffect(() => subscribeSiteClosure(setClosure), []);

  if (!closure) return <>{children}</>;

  const whatsappHref = whatsappLink(text("contact_whatsapp"));
  const supportEmail = text("contact_email");

  return (
    <Box className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Box className="w-16 h-16 rounded-2xl bg-white/6 border border-white/10 flex items-center justify-center">
        <CalendarX className="w-7 h-7 text-white" />
      </Box>

      <Heading
        level={1}
        className="text-2xl font-bold text-white font-outfit"
      >
        {t("siteClosed.title", { site: text("site_name") || t("siteClosed.fallbackSiteName") })}
      </Heading>

      <Text
        as="p"
        className="max-w-md text-sm leading-relaxed text-white/55 font-inter"
      >
        {t("siteClosed.description")}
      </Text>

      <Box className="flex items-center gap-4">
        {whatsappHref && (
          <Link
            href={whatsappHref}
            target="_blank"
            className="text-sm font-semibold text-[#9234EA] hover:text-[#A855F7] transition-colors"
          >
            WhatsApp
          </Link>
        )}
        {supportEmail && (
          <Link
            href={`mailto:${supportEmail}`}
            className="text-sm font-semibold text-[#9234EA] hover:text-[#A855F7] transition-colors"
          >
            {supportEmail}
          </Link>
        )}
      </Box>
    </Box>
  );
}
