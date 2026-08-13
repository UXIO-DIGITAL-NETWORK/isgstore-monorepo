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
  return (
    <Box className="flex max-w-sm flex-col gap-3 rounded-xl border border-border bg-card p-6">
      <Heading level={3}>Website Services</Heading>

      <Text
        variant="small"
        className="text-muted-foreground"
      >
        Access and manage all your services and payment gateway balance through the UDN Client Dashboard.
      </Text>

      {activeUntil && (
        <Text
          as="span"
          variant="small"
          className="text-success"
        >
          • Active until {formatDate(activeUntil)}
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
          Go Check
        </Button>
      </Link>
    </Box>
  );
}
