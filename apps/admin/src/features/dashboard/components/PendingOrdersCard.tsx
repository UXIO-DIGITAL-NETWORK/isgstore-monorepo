import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingOrders } from "../hooks/useDashboard";
import type { PendingOrders } from "../types/dashboard.type";

const ROWS: { key: keyof PendingOrders; label: string }[] = [
  { key: "manualOrders", label: "Manual Orders" },
  { key: "pendingPayment", label: "Pending Payment" },
  { key: "processing", label: "Processing" },
  { key: "failedTransaction", label: "Failed Transaction" },
];

export function PendingOrdersCard() {
  const { data, isLoading, isError, refetch } = usePendingOrders();

  return (
    <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <Box className="flex items-center justify-between">
        <Heading
          level={3}
          variant="section"
          className="text-lg"
        >
          Pending Orders
        </Heading>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-muted-foreground"
        >
          Show More
        </Button>
      </Box>

      <Box className="flex flex-col gap-3">
        {isError ? (
          <Box className="flex flex-col items-start gap-2">
            <Text variant="muted">Failed to load pending orders.</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </Box>
        ) : (
          ROWS.map((row) => (
            <Box
              key={row.key}
              className="flex items-center justify-between"
            >
              <Text variant="small">{row.label}</Text>
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
