import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatDate } from "@/utils/date";

import { InstallationWorkbench } from "../components/InstallationWorkbench";
import { useFinanceSubscription } from "../hooks/useFinance";

interface FinanceSubscriptionDetailPageProps {
  subscriptionId: number;
}

/**
 * One client's active period, and the installation behind it.
 *
 * The installation itself lives in `InstallationWorkbench`, shared with the
 * invoice page — the same (merchant, service) row is reachable from both.
 */
export default function FinanceSubscriptionDetailPage({ subscriptionId }: FinanceSubscriptionDetailPageProps) {
  const { t } = useTranslation("finance");
  const { data: subscription, isLoading, isError } = useFinanceSubscription(subscriptionId);

  if (isLoading) {
    return <Text variant="small">{t("subscriptionDetail.loading")}</Text>;
  }

  if (isError || !subscription) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>{t("subscriptionDetail.notFound")}</Heading>
        <Link
          href="/app/payment-internal/subscriptions"
          className="underline"
        >
          {t("subscriptionDetail.back")}
        </Link>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-internal/subscriptions"
          className="text-sm text-muted-foreground underline"
        >
          {t("subscriptionDetail.backArrow")}
        </Link>
        <Heading level={1}>{subscription.service?.name ?? t("subscriptionDetail.fallbackName")}</Heading>
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{subscription.merchant?.name ?? t("subscriptionDetail.fallbackClient")}</Heading>
          <StatusBadge status={subscription.status} />
        </Box>
        <Text variant="small">
          {t("subscriptionDetail.period", {
            start: formatDate(subscription.starts_at),
            end: formatDate(subscription.ends_at),
            count: subscription.days_remaining,
          })}
        </Text>
        {subscription.invoice_number && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {t("subscriptionDetail.invoice", { number: subscription.invoice_number })}
          </Text>
        )}
      </Box>

      <InstallationWorkbench scope={{ by: "subscription", id: subscriptionId }} />
    </Box>
  );
}
