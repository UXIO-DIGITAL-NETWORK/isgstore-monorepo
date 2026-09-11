import { useTranslation } from "react-i18next";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingOrders } from "../hooks/useDashboard";
import type { PendingOrders } from "../types/dashboard.type";

// `labelKey`, not `label`: a module constant would freeze whichever language
// was loaded at import.
const ROWS: { key: keyof PendingOrders; labelKey: string }[] = [
  { key: "manualOrders", labelKey: "manualOrders" },
  { key: "pendingPayment", labelKey: "pendingPayment" },
  { key: "processing", labelKey: "processing" },
  { key: "failedTransaction", labelKey: "failedTransaction" },
];

export function PendingOrdersCard() {
  const { t } = useTranslation("dashboard");
  const { data, isLoading, isError, refetch } = usePendingOrders();

  return (
    <Box className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4">
      <Box className="flex items-center justify-between">
        <Heading
          level={3}
          variant="section"
          className="text-lg"
        >{t("pendingOrders")}</Heading>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground"
        >{t("showMore")}</Button>
      </Box>

      <Box className="flex flex-col gap-3">
        {isError ? (
          <Box className="flex flex-col items-start gap-2">
            <Text variant="muted">{t("pendingOrdersFailed")}</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >{t("retry")}</Button>
          </Box>
        ) : (
          ROWS.map((row) => (
            <Box
              key={row.key}
              className="flex items-center justify-between"
            >
              <Text variant="small">{t(row.labelKey)}</Text>
              {isLoading || !data ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <Text
                  as="span"
                  className="font-medium tabular-nums text-foreground"
                >
                  {data[row.key]}
                </Text>
              )}
            </Box>
          ))
        )}
      </Box>
    </Box>
  );
}
