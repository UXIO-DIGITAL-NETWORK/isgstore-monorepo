import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

interface ProvisionalTabPageProps {
  title: string;
  subcopy: string;
}

/**
 * Shared shell for the Category tabs with no confirmed reference yet
 * (Category Type / Server Category / Category Provider) —
 * product_requirements.md §4.5 gives no design for these, so each is a
 * reduced placeholder, explicitly flagged as provisional. Sub Category
 * graduated off this shell on 2026-07-27 once its reference landed.
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
