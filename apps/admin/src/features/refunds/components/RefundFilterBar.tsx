import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RefundListParams, RefundMethod, RefundStatus } from "../types/refund.type";
import { REFUND_METHOD_LABELS, REFUND_STATUS_LABELS } from "./RefundStatusBadge";

interface RefundFilterBarProps {
  filters: RefundListParams;
  onChange: (next: RefundListParams) => void;
}

/** Sentinel for "no filter" — a Radix SelectItem cannot hold an empty value. */
const ALL = "__all__";

const STATUSES = Object.keys(REFUND_STATUS_LABELS) as RefundStatus[];
const METHODS = Object.keys(REFUND_METHOD_LABELS) as RefundMethod[];

export function RefundFilterBar({ filters, onChange }: RefundFilterBarProps) {
  const { t } = useTranslation("refunds");
  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Box className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          aria-label={t("searchRefunds")}
          className="rounded-xl pl-9"
          placeholder={t("searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(event) => onChange({ ...filters, search: event.target.value || undefined })}
        />
      </Box>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(value) => onChange({ ...filters, status: value === ALL ? undefined : (value as RefundStatus) })}
      >
        <SelectTrigger
          aria-label={t("filterByStatus")}
          className="w-full rounded-xl sm:w-52"
        >
          <SelectValue placeholder={t("allStatuses")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allStatuses")}</SelectItem>
          {STATUSES.map((status) => (
            <SelectItem
              key={status}
              value={status}
            >
              {REFUND_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.method ?? ALL}
        onValueChange={(value) => onChange({ ...filters, method: value === ALL ? undefined : (value as RefundMethod) })}
      >
        <SelectTrigger
          aria-label={t("filterByMethod")}
          className="w-full rounded-xl sm:w-52"
        >
          <SelectValue placeholder={t("allMethods")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{t("allMethods")}</SelectItem>
          {METHODS.map((method) => (
            <SelectItem
              key={method}
              value={method}
            >
              {REFUND_METHOD_LABELS[method]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Two derived views rather than statuses: "overdue" cuts across PENDING
          and PROCESSING, and "unclaimed" is the outstanding-liability list
          finance asks for. Toggles, because they compose with the filters. */}
      <Button
        type="button"
        variant={filters.overdue ? "default" : "outline"}
        className="rounded-xl"
        aria-pressed={Boolean(filters.overdue)}
        onClick={() => onChange({ ...filters, overdue: filters.overdue ? undefined : true })}
      >{t("overdue")}</Button>

      <Button
        type="button"
        variant={filters.unclaimed ? "default" : "outline"}
        className="rounded-xl"
        aria-pressed={Boolean(filters.unclaimed)}
        onClick={() => onChange({ ...filters, unclaimed: filters.unclaimed ? undefined : true })}
      >{t("unclaimed")}</Button>
    </Box>
  );
}
