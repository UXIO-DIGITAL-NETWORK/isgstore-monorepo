import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/utils/date";
import type { ActivityLog, ActivityType } from "../types/activity.type";

/** Human labels for the machine-readable `type` enum. */
const TYPE_LABEL: Record<ActivityType, string> = {
  login: "Login",
  membership: "Membership",
  transaction: "Transaction",
  security: "Security",
  verification: "Verification",
  failed: "Failed",
};

/**
 * Columns for the admin Activity Log. The `No.` column is injected by the shared
 * `DataTable` (`showRowNumber`). The feed is read-only, so there is no action
 * column.
 */
export const activityColumns: ColumnDef<ActivityLog>[] = [
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.actor}
        </Text>
        {row.original.role && (
          <Text
            as="span"
            variant="muted"
          >
            {row.original.role}
          </Text>
        )}
      </Box>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: ({ row }) => {
      const { type } = row.original;
      return type ? (
        <Badge variant="outline">{TYPE_LABEL[type]}</Badge>
      ) : (
        <Text
          as="span"
          variant="muted"
        >
          —
        </Text>
      );
    },
  },
  {
    id: "message",
    header: "Message",
    cell: ({ row }) => <Text as="span">{row.original.message}</Text>,
  },
  {
    id: "ip",
    header: "IP Address",
    cell: ({ row }) => (
      <Text
        as="span"
        variant="muted"
        className="tabular-nums"
      >
        {row.original.ipAddress ?? "—"}
      </Text>
    ),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => (
      <Text
        as="span"
        variant="muted"
      >
        {formatRelativeTime(row.original.createdAt)}
      </Text>
    ),
  },
];
