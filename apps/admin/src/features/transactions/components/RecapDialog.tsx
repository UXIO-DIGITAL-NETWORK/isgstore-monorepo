import { useState } from "react";
import { Download } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";
import { useRecap } from "../hooks/useTransactions";
import { downloadBlob } from "../lib/downloadBlob";
import { recapToCsv } from "../lib/recapCsv";
import type { RecapPeriod } from "../types/transaction.type";

interface RecapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Daily/monthly transaction recap (product_requirements.md §4.3): a per-group
 * breakdown with a totals footer and a client-side CSV download. The query
 * only runs while the dialog is open and re-runs when the period flips.
 */
export function RecapDialog({ open, onOpenChange }: RecapDialogProps) {
  const [period, setPeriod] = useState<RecapPeriod>("daily");
  const { data, isLoading, isError, refetch } = useRecap(period, open);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Recap</DialogTitle>
          <DialogDescription>
            Daily and monthly summaries with a breakdown per product and payment channel.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as RecapPeriod)}
        >
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        {isError ? (
          <Box className="flex flex-col items-center gap-3 py-8">
            <Text variant="muted">Couldn't load the recap.</Text>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </Box>
        ) : isLoading || !data ? (
          <Text
            variant="muted"
            className="py-8 text-center"
          >
            Loading recap…
          </Text>
        ) : data.rows.length === 0 ? (
          <Text
            variant="muted"
            className="py-8 text-center"
          >
            No transactions in this period.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Breakdown</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.count}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{data.totals.count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(data.totals.revenue)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={!data || data.rows.length === 0}
            onClick={() => data && downloadBlob(new Blob([recapToCsv(data)], { type: "text/csv" }), `recap-${period}.csv`)}
          >
            <Download />
            Download CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
