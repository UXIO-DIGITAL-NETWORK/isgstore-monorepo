import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

interface ProvisionalTabPageProps {
  title: string;
  subcopy: string;
}

/**
 * Shared shell for Category tabs with no confirmed reference yet — as of
 * 2026-07-28 that is **only Category Provider**. product_requirements.md
 * §4.5 gives no design for it, so it stays a reduced placeholder, flagged
 * as provisional. Sub Category, Category Type and Category Server each
 * graduated off this shell as their references landed.
 */
export function ProvisionalTabPage({ title, subcopy }: ProvisionalTabPageProps) {
  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          {title}
        </Heading>
        <Text variant="muted">{subcopy}</Text>
      </Box>

      <Box className="rounded-2xl border border-dashed border-border bg-card p-6">
        <Text variant="muted">Provisional — pending its own reference design. No list or add form yet.</Text>
      </Box>
    </Box>
  );
}
