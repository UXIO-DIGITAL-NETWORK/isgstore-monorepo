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
  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Box className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          aria-label="Search refunds"
          className="rounded-xl pl-9"
          placeholder="Refund no., invoice no., email or phone"
          value={filters.search ?? ""}
          onChange={(event) => onChange({ ...filters, search: event.target.value || undefined })}
        />
      </Box>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(value) => onChange({ ...filters, status: value === ALL ? undefined : (value as RefundStatus) })}
      >
        <SelectTrigger
          aria-label="Filter by status"
          className="w-full rounded-xl sm:w-52"
        >
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
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
          aria-label="Filter by method"
          className="w-full rounded-xl sm:w-52"
        >
          <SelectValue placeholder="All methods" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All methods</SelectItem>
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
      >
        Overdue
      </Button>

      <Button
        type="button"
        variant={filters.unclaimed ? "default" : "outline"}
        className="rounded-xl"
        aria-pressed={Boolean(filters.unclaimed)}
        onClick={() => onChange({ ...filters, unclaimed: filters.unclaimed ? undefined : true })}
      >
        Unclaimed
      </Button>
    </Box>
  );
}
