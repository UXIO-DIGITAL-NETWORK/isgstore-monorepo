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
import { TRANSACTION_TYPES, type TransactionFilterState } from "@/lib/transactionSearch";

interface Props {
  value: TransactionFilterState;
  onChange: (patch: Partial<TransactionFilterState>) => void;
  /** Optional extra control (e.g. the internal Merchant select). */
  extra?: ReactNode;
}

/** Label keys, keyed by the same values the URL is validated against. */
const TYPE_LABEL_KEYS: Record<string, string> = {
  all: "filters.allTypes",
  sale: "filters.typeSale",
  service: "filters.typeService",
};

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

/** Search + type + date-range bar. A change resets the caller's page.
 *
 * Status is deliberately NOT here: both pages that use this bar put the
 * clickable summary pills directly above it, and two controls writing the same
 * `status_group` meant the same filter appeared twice, in two vocabularies. The
 * pills carry the counts, so they are the better half to keep.
 */
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

      <Field label={t("filters.type")}>
        <Select value={value.type} onValueChange={(next) => onChange({ type: next })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filters.allTypes")} />
          </SelectTrigger>
          <SelectContent>
            {TRANSACTION_TYPES.map((value) => (
              <SelectItem key={value} value={value}>
                {t(TYPE_LABEL_KEYS[value])}
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
