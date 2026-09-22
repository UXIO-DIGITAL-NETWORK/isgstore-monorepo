import { useTranslation } from "react-i18next";
import { CalendarClock, ExternalLink } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date";
import { useWebsiteSubscription } from "../hooks/useWebsiteSubscription";
import type { GoverningService } from "../services/websiteSubscription.service";

/**
 * The site's own subscription, in the sidebar footer.
 *
 * Kept short on purpose: one line per service, the name and how long it holds,
 * and nothing else. The label that used to explain the list is gone — it was
 * longer than the list it introduced. Detail opens the same lines in a dialog for
 * anyone who wants the full picture without the footer growing on every page.
 *
 * The renew link leaves for the payment panel, where the client signs in with
 * their own payment-admin account — every route there is behind a login, so the
 * copy says where they are going rather than pretending it is an in-app action.
 * It no longer names kita's brand: this card sits in the client's own panel, and
 * the service label beside it already carries the site's name.
 *
 * Collapsed state is handled by the sidebar's own `group-data-[collapsible=icon]`
 * utilities rather than by branching on the sidebar state for layout; the state
 * is read only to keep the collapsed rail's tooltip.
 */
export function WebsiteSubscriptionCard() {
  const { t } = useTranslation("dashboard");
  const { data } = useWebsiteSubscription();
  const { state, isMobile } = useSidebar();

  // Nothing configured, or still loading: render nothing rather than a card
  // that says "—" on every page.
  if (!data || data.status === "unconfigured" || !data.checkout_url) return null;

  const urgent =
    data.status === "expired" || data.status === "expiring_soon" || data.status === "suspended";

  const summary =
    // A suspension outranks the date: the storefront is already refusing
    // customers, and "300 hari tersisa" here would be the one screen that
    // should explain the outage denying it instead.
    data.status === "suspended"
      ? (data.suspend_reason ?? t("siteDisabled"))
      : data.status === "expired"
        ? t("subscriptionExpired")
        : data.status === "none"
          ? t("subscriptionNone")
          : data.lifetime
            // Nothing to count down to, and nothing to renew — saying a number
            // of days here would invent a deadline the client does not have.
            ? t("subscriptionLifetime")
            : t("subscriptionDaysRemaining", { days: data.days_remaining });

  // WHAT keeps the site up, beside the one overall term above it. Empty on a
  // standalone site, where there is no Hub plan to read.
  const services = data.services ?? [];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Box
          className={cn(
            "flex flex-col gap-1.5 rounded-xl border p-3",
            urgent ? "border-warning text-warning" : "border-border",
          )}
        >
          {/* The site and its state. Not itself a link: the renew link sits at
              the foot of the card, beside Detail. */}
          <Box
            className="flex items-start gap-2"
            title={
              state === "collapsed" && !isMobile
                ? `${data.service?.name ?? t("subscription")} — ${summary}`
                : undefined
            }
          >
            <CalendarClock className="mt-0.5 size-4 shrink-0" />
            <Box className="flex min-w-0 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
              <Text
                as="span"
                className="truncate text-xs font-medium"
              >
                {data.service?.name ?? t("websiteSubscription")}
              </Text>
              <Text
                as="span"
                variant="small"
                className={cn("truncate", urgent ? "text-warning" : "text-muted-foreground")}
              >
                {summary}
              </Text>
            </Box>
          </Box>

          {services.length > 0 && (
            // The services that carry the term, each with how long it lasts. A
            // lifetime/one-time line prints no period at all: "365 hari" beside
            // "Seumur hidup" contradicts itself.
            <Box className="flex flex-col gap-0.5 border-t border-border/60 pt-1 group-data-[collapsible=icon]:hidden">
              <ServiceLines services={services} />
            </Box>
          )}

          <Box className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
            {services.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {t("subscriptionDetail")}
                  </button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl sm:max-w-sm">
                  <DialogHeader>
                    <DialogTitle>{t("subscriptionDetailTitle")}</DialogTitle>
                    <DialogDescription>{t("subscriptionDetailDescription")}</DialogDescription>
                  </DialogHeader>
                  <Box className="flex flex-col gap-2">
                    <ServiceLines services={services} />
                  </Box>
                </DialogContent>
              </Dialog>
            )}
            <a
              href={data.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium hover:underline"
            >
              {t("renewSubscription")}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          </Box>
        </Box>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

/** One line per governing service: what it is, and how long it holds. */
function ServiceLines({ services }: { services: GoverningService[] }) {
  const { t } = useTranslation("dashboard");

  return (
    <>
      {services.map((service) => (
        <Box
          key={service.service_code}
          className="flex items-baseline justify-between gap-2"
        >
          <Text
            as="span"
            variant="small"
            className="truncate"
          >
            {service.service_name}
          </Text>
          <Text
            as="span"
            variant="small"
            className="shrink-0 tabular-nums text-muted-foreground"
          >
            {service.lifetime
              ? t("subscriptionLifetime")
              : service.active_until
                ? t("licenceActiveUntil", { date: formatDate(service.active_until) })
                : t("licenceNoPeriod")}
          </Text>
        </Box>
      ))}
    </>
  );
}
