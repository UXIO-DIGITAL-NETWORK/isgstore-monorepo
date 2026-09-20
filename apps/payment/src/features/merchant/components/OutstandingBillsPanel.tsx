import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import type { ServicePaymentChannel, ServicePlanLine } from "@/types/service.type";

import { adminFeeFor } from "../lib/adminFee";
import { usePayInvoiceBatch, useServicePaymentChannels } from "../hooks/useMerchant";
import { PaymentChannelPicker } from "./PaymentChannelPicker";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

type Bill = ServicePlanLine["outstanding"][number] & {
  service_name: string;
  /** Carried from the line, so the row can say a bill is a one-off. */
  billing_mode: ServicePlanLine["billing_mode"];
};

/** "Tidak ada jatuh tempo" sorts last; everything else by date. */
const dueKey = (due: string | null) => due?.slice(0, 10) ?? "9999-12-31";

/**
 * Everything the client owes, grouped by the day it falls due.
 *
 * The grouping is the point: bills that fall due together are almost always
 * paid together, and paying them in one attempt costs ONE channel fee instead
 * of one per bill. Any other combination can still be ticked by hand.
 *
 * The fee shown here is computed on the SUM, mirroring the server — a fee
 * summed per bill would quote a number nobody is ever charged.
 */
export function OutstandingBillsPanel({ lines }: { lines: ServicePlanLine[] }) {
  const { t } = useTranslation("merchant");
  const navigate = useNavigate();
  const { data: channels, isLoading: loadingChannels, isError: channelsError } = useServicePaymentChannels();
  const { mutate: pay, isPending: paying } = usePayInvoiceBatch();

  const [selected, setSelected] = useState<number[]>([]);
  const [channel, setChannel] = useState<ServicePaymentChannel | null>(null);

  const groups = useMemo(() => {
    const bills: Bill[] = lines.flatMap((line) =>
      line.outstanding.map((bill) => ({
        ...bill,
        service_name: line.service_name,
        billing_mode: line.billing_mode,
      })),
    );

    const byDue = new Map<string, Bill[]>();

    for (const bill of bills) {
      const key = dueKey(bill.due_at);
      byDue.set(key, [...(byDue.get(key) ?? []), bill]);
    }

    return [...byDue.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [lines]);

  const all = groups.flatMap(([, bills]) => bills);
  const chosen = all.filter((bill) => selected.includes(bill.id));
  const subtotal = chosen.reduce((sum, bill) => sum + bill.amount, 0);
  // Once, on the sum — exactly as the server will charge it.
  const fee = adminFeeFor(channel, subtotal);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleGroup = (bills: Bill[]) => {
    const ids = bills.map((b) => b.id);
    const allChosen = ids.every((id) => selected.includes(id));

    setSelected((prev) =>
      allChosen ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])],
    );
  };

  if (all.length === 0) {
    // "Everything is settled" is a CLAIM, and it is false when there is no plan
    // to read at all — which is exactly what a site whose Hub plan has never
    // been pulled sees. Reassuring copy there would hide a broken sync behind a
    // sentence the client has no reason to doubt.
    return (
      <Box className="flex flex-col gap-1">
        <Text variant="small">{lines.length === 0 ? t("bills.noPlan") : t("bills.nothingDue")}</Text>
        {lines.length === 0 && (
          <Text
            as="span"
            variant="small"
            className="text-muted-foreground"
          >
            {t("bills.noPlanHint")}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-6">
      {groups.map(([due, bills]) => (
        <Box key={due} className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <Box className="flex flex-wrap items-center justify-between gap-2">
            <Heading level={3}>
              {due === "9999-12-31" ? t("bills.noDueDate") : t("bills.dueOn", { date: formatDate(due) })}
            </Heading>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleGroup(bills)}
            >
              {t("bills.selectGroup")}
            </Button>
          </Box>

          {bills.map((bill) => {
            const id = `bill-${bill.id}`;

            return (
              <Box key={bill.id} className="flex items-center gap-3 border-t border-border pt-2">
                <Checkbox
                  id={id}
                  checked={selected.includes(bill.id)}
                  onCheckedChange={() => toggle(bill.id)}
                />
                {/* The whole row is the label, not just the name: a bill you
                    have to hit a small box to pay is a bill somebody will not
                    pay. */}
                <label
                  htmlFor={id}
                  className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3"
                >
                  <Box className="flex min-w-0 flex-1 flex-col">
                    <Box className="flex items-center gap-1.5">
                      <Text
                        as="span"
                        className="text-sm font-medium"
                      >
                        {bill.service_name}
                      </Text>
                      {/* A setup fee is paid once and buys no period, which is worth
                          saying: the client should not expect a renewal after it. */}
                      {bill.billing_mode === "one_time" && (
                        <Badge variant="secondary">{t("bills.oneTime")}</Badge>
                      )}
                    </Box>
                    <Text as="span" variant="small" className="text-muted-foreground">
                      {bill.invoice_number}
                      {bill.period_starts_at &&
                        bill.period_ends_at &&
                        ` · ${formatDate(bill.period_starts_at)} – ${formatDate(bill.period_ends_at)}`}
                    </Text>
                  </Box>
                  <Text as="span" className="tabular-nums">{money(bill.amount)}</Text>
                </label>
              </Box>
            );
          })}
        </Box>
      ))}

      {/* On screen from the start, once there is something to pay. A pay button
          that only appears after an unstated precondition is one a client never
          finds — which is what happened the first time this panel shipped. */}
      <Box className="sticky bottom-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        {chosen.length === 0 ? (
          <Box className="flex flex-wrap items-center justify-between gap-3">
            <Text
              as="span"
              variant="small"
              className="text-muted-foreground"
            >
              {t("bills.selectHint")}
            </Text>
            <Button disabled>{t("bills.paySelected")}</Button>
          </Box>
        ) : (
          <>
            <PaymentChannelPicker
              channels={channels ?? []}
              isError={channelsError}
              selectedId={channel?.id ?? null}
              onSelect={setChannel}
              isLoading={loadingChannels}
            />

            <Box className="flex flex-col gap-1 border-t border-border pt-3">
              <Box className="flex justify-between">
                <Text as="span" variant="small">
                  {t("bills.selectedCount", { count: chosen.length })}
                </Text>
                <Text as="span" className="tabular-nums">{money(subtotal)}</Text>
              </Box>
              <Box className="flex justify-between">
                {/* Once for the whole set — saying so is what makes paying
                    together visibly cheaper than paying one at a time. */}
                <Text as="span" variant="small" className="text-muted-foreground">
                  {t("bills.feeOnce")}
                </Text>
                <Text as="span" variant="small" className="tabular-nums">{money(fee)}</Text>
              </Box>
              <Box className="flex justify-between font-medium">
                <Text as="span">{t("bills.total")}</Text>
                <Text as="span" className="tabular-nums">{money(subtotal + fee)}</Text>
              </Box>
            </Box>

            <Button
              disabled={!channel || paying}
              onClick={() =>
                channel &&
                pay(
                  { invoiceIds: chosen.map((b) => b.id), channelId: channel.id },
                  {
                    onSuccess: (attempt) =>
                      navigate({
                        to: "/app/payment-admin/service-payments/$reference",
                        params: { reference: attempt.reference_id },
                      }),
                  },
                )
              }
            >
              {t("bills.paySelected")}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}
