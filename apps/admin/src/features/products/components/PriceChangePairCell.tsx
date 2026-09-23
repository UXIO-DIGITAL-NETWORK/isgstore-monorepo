import { ArrowRight } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";

/**
 * A price/cost change rendered as old → new (whole rupiah). When there is no new
 * value — a deactivated event, or a historical `locked` one, neither of which
 * repriced — only the old value is shown, plainly.
 */
export function PriceChangePairCell({ oldValue, newValue }: { oldValue: number | null; newValue: number | null }) {
  const old = oldValue === null ? "—" : formatCurrency(oldValue, { fractionDigits: 0 });

  if (newValue === null) {
    return (
      <Text as="span" variant="small" className="text-muted-foreground tabular-nums">
        {old}
      </Text>
    );
  }

  return (
    <Box className="flex items-center gap-1.5">
      <Text as="span" variant="small" className="text-muted-foreground line-through tabular-nums">
        {old}
      </Text>
      <ArrowRight className="size-3 text-muted-foreground" />
      <Text as="span" className="font-medium tabular-nums">
        {formatCurrency(newValue, { fractionDigits: 0 })}
      </Text>
    </Box>
  );
}
