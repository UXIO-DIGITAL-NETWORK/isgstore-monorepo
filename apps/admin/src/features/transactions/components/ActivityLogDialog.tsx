import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Bot } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { initials } from "@/utils/initials";
import { useTransactionActivityLog } from "../hooks/useTransactions";
import type { ActivityLogEntry } from "../types/transaction.type";

const COLUMN_COUNT = 5;
const LOADING_ROW_COUNT = 3;

interface ActivityLogDialogProps {
  transactionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Automated events collapse to one muted "System" identity with an icon
 * avatar and no phone line, so they read as distinct at a glance from a real
 * operator, who keeps the table's avatar + name-over-phone shape.
 */
function ActorCell({ actor }: { actor: ActivityLogEntry["actor"] }) {
  const { t } = useTranslation("transactions");
  if (actor === "system") {
    return (
      <Box className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <Bot className="size-3.5" />
          </AvatarFallback>
        </Avatar>
        <Text
          as="span"
          variant="muted"
        >{t("system")}</Text>
      </Box>
    );
  }

  return (
    <Box className="flex items-center gap-2">
      <Avatar
        size="sm"
        className="shrink-0"
      >
        <AvatarFallback>{initials(actor.name)}</AvatarFallback>
      </Avatar>
      {/* min-w-0 so a long name wraps inside the fixed-width column instead
          of forcing the flex row wider. */}
      <Box className="flex min-w-0 flex-col">
        <Text
          as="span"
          className="break-words"
        >
          {actor.name}
        </Text>
        {actor.phone && (
          <Text
            as="span"
            variant="muted"
            className="break-words"
          >
            {actor.phone}
          </Text>
        )}
      </Box>
    </Box>
  );
}

/**
 * Per-transaction audit trail (product_requirements.md §4.3, confirmed
 * 2026-07-13). Two details of the reference image are deliberately not
 * reproduced: its subcopy was the unedited shadcn dialog template default
 * ("Set the dimentions for the layer."), and its two example rows were
 * identical, repeating the parent row's product name and target reference in
 * the Action/Description columns. The table structure is exactly as drawn;
 * Action is a short event label and Description that event's specific detail.
 */
export function ActivityLogDialog({ transactionId, open, onOpenChange }: ActivityLogDialogProps) {
  const { t } = useTranslation("transactions");
  const { data, isLoading, isError, refetch } = useTransactionActivityLog(transactionId, open);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {/* Wider than the sm:max-w-lg default — five columns don't fit it. */}
      <DialogContent
        className="rounded-2xl sm:max-w-3xl"
        overlayClassName="bg-black/70"
      >
        <DialogHeader>
          <DialogTitle>{t("activityLog")}</DialogTitle>
          <DialogDescription>{t("activityLogSubtitle")}</DialogDescription>
        </DialogHeader>

        {/* Error renders inline rather than as an early return (unlike
            TransactionsTable): DialogHeader supplies the dialog's accessible
            name, so it has to stay mounted.

            The table below is table-fixed with explicit column widths, and
            its container overrides the default overflow-x-auto: long
            Action/Description text wraps onto the next line instead of
            widening the table into a horizontal scrollbar. */}
        {isError ? (
          <Box className="flex flex-col items-center gap-3 rounded-lg border border-border py-10">
            <Text variant="muted">{t("activityLogFailed")}</Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >{t("retry")}</Button>
          </Box>
        ) : (
          <Table
            className="table-fixed"
            containerClassName="overflow-x-visible"
          >
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{t("colNo")}</TableHead>
                <TableHead className="w-44">{t("colUser")}</TableHead>
                <TableHead className="w-36">{t("colAction")}</TableHead>
                <TableHead>{t("colDescription")}</TableHead>
                <TableHead className="w-32">{t("colTime")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || !data ? (
                Array.from({ length: LOADING_ROW_COUNT }).map((_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {Array.from({ length: COLUMN_COUNT }).map((_, colIndex) => (
                      <TableCell key={colIndex}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={COLUMN_COUNT}
                    className="py-8 text-center text-muted-foreground"
                  >{t("noActivity")}</TableCell>
                </TableRow>
              ) : (
                data.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="align-top tabular-nums text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="align-top">
                      <ActorCell actor={entry.actor} />
                    </TableCell>
                    <TableCell className="align-top font-medium whitespace-normal">{entry.action}</TableCell>
                    <TableCell className="align-top whitespace-normal text-muted-foreground">
                      {entry.description}
                    </TableCell>
                    {/* Seconds included: entries for one transaction can land
                        in the same minute, unlike the table's Time column. */}
                    <TableCell className="align-top whitespace-normal text-muted-foreground tabular-nums">
                      {format(new Date(entry.created_at), "MMM d, HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
