import type { TFunction } from "i18next";
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
  data: "Perubahan Data",
  security: "Security",
  verification: "Verification",
  failed: "Failed",
};

/**
 * Columns for the admin Activity Log. The `No.` column is injected by the shared
 * `DataTable` (`showRowNumber`). The feed is read-only, so there is no action
 * column.
 */
/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const activityColumnsFor = (t: TFunction<"activity">): ColumnDef<ActivityLog>[] => [
  {
    id: "actor",
    header: t("colActor"),
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
    header: t("colType"),
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
    header: t("colMessage"),
    cell: ({ row }) => <Text as="span">{row.original.message}</Text>,
  },
  {
    id: "ip",
    header: t("colIp"),
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
    header: t("colTime"),
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
