import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import type { Feedback } from "../types/feedback.type";

/**
 * Columns for the admin Feedback list. The `No.` column is injected by the
 * shared `DataTable` (`showRowNumber`). Read-only — no action column.
 */
export const feedbackColumns: ColumnDef<Feedback>[] = [
  {
    id: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => (
      <Box className="flex items-center gap-2">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.reviewer}
        </Text>
        {row.original.isGuest && <Badge variant="outline">Guest</Badge>}
      </Box>
    ),
  },
  {
    id: "rating",
    header: "Rating",
    // Five stars, filled up to the score, plus the numeric value.
    cell: ({ row }) => (
      <Box className="flex items-center gap-1">
        <Box className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "size-3.5",
                star <= row.original.rating ? "fill-foreground text-foreground" : "text-muted-foreground",
              )}
            />
          ))}
        </Box>
        <Text
          as="span"
          variant="muted"
          className="tabular-nums"
        >
          {row.original.rating}
        </Text>
      </Box>
    ),
  },
  {
    id: "comment",
    header: "Comment",
    cell: ({ row }) =>
      row.original.comment ? (
        <Text as="span">{row.original.comment}</Text>
      ) : (
        <Text
          as="span"
          variant="muted"
        >
          —
        </Text>
      ),
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => (
      <Text
        as="span"
        variant={row.original.product ? "default" : "muted"}
      >
        {row.original.product ?? "—"}
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
