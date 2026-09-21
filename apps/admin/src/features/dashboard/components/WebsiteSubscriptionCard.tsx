import { useTranslation } from "react-i18next";
import { CalendarClock, ExternalLink } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useWebsiteSubscription } from "../hooks/useWebsiteSubscription";

/**
 * The site's own subscription, in the sidebar footer.
 *
 * The button leaves for the payment panel, where the client signs in with their
 * own payment-admin account — every route there is behind a login, so the copy
 * says where they are going rather than pretending it is an in-app action. It
 * no longer names kita's brand: this card sits in the client's own panel, and
 * the service label beside it already carries the site's name.
 *
 * Collapsed state is handled by the sidebar's own `group-data-[collapsible=icon]`
 * utilities rather than by branching on `useSidebar().state`, matching how the
 * rest of this file works.
 */
export function WebsiteSubscriptionCard() {
  const { t } = useTranslation("dashboard");
  const { data } = useWebsiteSubscription();

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
        ? "Langganan berakhir"
        : data.status === "none"
          ? "Belum berlangganan"
          : data.lifetime
            // Nothing to count down to, and nothing to renew — saying a number
            // of days here would invent a deadline the client does not have.
            ? "Seumur hidup"
            : `${data.days_remaining} hari tersisa`;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          tooltip={`${data.service?.name ?? t("subscription")} — ${summary}`}
          className={cn(
            "h-auto items-start gap-2 rounded-xl border p-3",
            urgent ? "border-warning text-warning" : "border-border",
          )}
        >
          <a
            href={data.checkout_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarClock className="size-4 shrink-0" />
            {/* Hidden in icon mode by the sidebar's own utility, so the
                collapsed rail keeps just the icon and its tooltip. */}
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
              <Text
                as="span"
                variant="small"
                className="mt-1 inline-flex items-center gap-1 truncate font-medium"
              >{t("renewSubscription")}<ExternalLink className="size-3 shrink-0" />
              </Text>
            </Box>
          </a>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
