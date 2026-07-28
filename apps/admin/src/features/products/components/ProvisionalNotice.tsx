import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

interface ProvisionalNoticeProps {
  title: string;
  description: string;
}

/**
 * A screen that exists so its route resolves and its entry point is not a dead
 * link, but whose content has no reference frame yet (product_requirements.md
 * §3: roadmap items "should render a lightweight 'coming soon' state rather
 * than broken screens").
 *
 * Two consumers this round — the Product Provider tab and the Add Main
 * Products route — which is why the copy is a prop. Categories carried the
 * same shape as `ProvisionalTabPage` while its five tabs were confirmed one at
 * a time; it was deleted once all five landed, and this is the pattern coming
 * back for the feature that now needs it.
 */
export function ProvisionalNotice({ title, description }: ProvisionalNoticeProps) {
  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          {title}
        </Heading>
        <Text variant="muted">{description}</Text>
      </Box>

      <Box className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <Text className="font-medium">Not designed yet</Text>
        <Text
          variant="muted"
          className="max-w-md"
        >
          This screen is waiting on a reference frame. Nothing is built here rather than guessing at fields and rules
          that have not been specified.
        </Text>
      </Box>
    </Box>
  );
}
