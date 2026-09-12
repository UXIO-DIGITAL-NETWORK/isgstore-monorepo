import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/date";
import { FeedbackRowActions } from "./FeedbackRowActions";
import type { Feedback } from "../types/feedback.type";

/**
 * Columns for the admin Feedback list. The `No.` column is injected by the
 * shared `DataTable` (`showRowNumber`). The only row action is delete —
 * reviews are customer-authored and are never edited here.
 */
export const feedbackColumns = (
  onDelete: (id: string) => void,
  t: TFunction<"feedback">,
): ColumnDef<Feedback>[] => [
  {
    id: "reviewer",
    header: t("colReviewer"),
    cell: ({ row }) => (
      <Box className="flex items-center gap-2">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.reviewer}
        </Text>
        {row.original.isGuest && <Badge variant="outline">{t("guest")}</Badge>}
      </Box>
    ),
  },
  {
    id: "rating",
    header: t("colRating"),
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
    header: t("colComment"),
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
    header: t("colProduct"),
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
  {
    id: "actions",
    cell: ({ row }) => (
      <FeedbackRowActions
        id={row.original.id}
        label={row.original.reviewer}
        onDelete={onDelete}
      />
    ),
  },
];
