import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TransactionFilterState {
  search: string;
  /** "" | "success" | "pending" | "failed". */
  statusGroup: string;
  /** "all" | "sale" | "service". */
  type: string;
  /** "" or "YYYY-MM-DD". */
  startDate: string;
  endDate: string;
}

interface Props {
  value: TransactionFilterState;
  onChange: (patch: Partial<TransactionFilterState>) => void;
  /** Optional extra control (e.g. the internal Merchant select). */
  extra?: ReactNode;
}

const STATUS_OPTIONS = [
  { value: "all", labelKey: "filters.allStatuses" },
  { value: "success", labelKey: "filters.statusSuccess" },
  { value: "pending", labelKey: "filters.statusPending" },
  { value: "failed", labelKey: "filters.statusFailed" },
];

const TYPE_OPTIONS = [
  { value: "all", labelKey: "filters.allTypes" },
  { value: "sale", labelKey: "filters.typeSale" },
  { value: "service", labelKey: "filters.typeService" },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box className="flex min-w-[160px] flex-1 flex-col gap-1.5">
      <Text as="span" variant="small" className="font-medium text-muted-foreground">
        {label}
      </Text>
      {children}
    </Box>
  );
}

/** Search + status + type + date-range bar. A change resets the caller's page. */
export function TransactionFilters({ value, onChange, extra }: Props) {
  const { t } = useTranslation("common");

  return (
    <Box className="flex flex-wrap items-end gap-3">
      <Field label={t("filters.search")}>
        <Input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder={t("filters.searchPlaceholder")}
        />
      </Field>

      <Field label={t("filters.status")}>
        <Select
          value={value.statusGroup || "all"}
          onValueChange={(next) => onChange({ statusGroup: next === "all" ? "" : next })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filters.allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label={t("filters.type")}>
        <Select value={value.type} onValueChange={(next) => onChange({ type: next })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {extra ? <Field label={t("filters.client")}>{extra}</Field> : null}

      <Field label={t("filters.dateFrom")}>
        <Input
          type="date"
          value={value.startDate}
          max={value.endDate || undefined}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </Field>

      <Field label={t("filters.dateTo")}>
        <Input
          type="date"
          value={value.endDate}
          min={value.startDate || undefined}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </Field>
    </Box>
  );
}
