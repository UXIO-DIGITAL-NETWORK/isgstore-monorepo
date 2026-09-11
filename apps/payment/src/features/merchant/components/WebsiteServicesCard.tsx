import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/date";

interface WebsiteServicesCardProps {
  /** Nearest subscription expiry; null when nothing is subscribed. */
  activeUntil: string | null;
}

/**
 * Entry point to the client's Services page, showing the one date that matters:
 * when the earliest of its subscriptions runs out.
 *
 * With nothing subscribed the green line is omitted rather than showing a
 * placeholder date — an invented "Active until" would be worse than silence.
 */
export function WebsiteServicesCard({ activeUntil }: WebsiteServicesCardProps) {
  const { t } = useTranslation("merchant");

  return (
    <Box className="flex max-w-sm flex-col gap-3 rounded-xl border border-border bg-card p-6">
      <Heading level={3}>{t("websiteCard.title")}</Heading>

      <Text
        variant="small"
        className="text-muted-foreground"
      >
        {t("websiteCard.description")}
      </Text>

      {activeUntil && (
        <Text
          as="span"
          variant="small"
          className="text-success"
        >
          {t("websiteCard.activeUntil", { date: formatDate(activeUntil) })}
        </Text>
      )}

      <Link
        href="/app/payment-admin/services"
        className="w-full"
      >
        <Button
          variant="secondary"
          className="w-full"
        >
          {t("websiteCard.cta")}
        </Button>
      </Link>
    </Box>
  );
}
