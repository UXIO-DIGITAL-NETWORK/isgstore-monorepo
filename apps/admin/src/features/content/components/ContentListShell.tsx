import type { ReactNode } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";

interface ContentListShellProps {
  title: string;
  description: string;
  toolbar: ReactNode;
  table: ReactNode;
}

/** The card stack every content list repeats: header, toolbar, table. */
export function ContentListShell({ title, description, toolbar, table }: ContentListShellProps) {
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

      <Box className="rounded-2xl border border-border bg-card p-4">{toolbar}</Box>
      <Box className="rounded-2xl border border-border bg-card p-4">{table}</Box>
    </Box>
  );
}
