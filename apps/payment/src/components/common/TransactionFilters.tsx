import type { ReactNode } from "react";

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
  { value: "all", label: "Semua status" },
  { value: "success", label: "Sukses" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Gagal" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Semua tipe" },
  { value: "sale", label: "Penjualan" },
  { value: "service", label: "Tagihan Layanan" },
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
  return (
    <Box className="flex flex-wrap items-end gap-3">
      <Field label="Cari">
        <Input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="No. invoice"
        />
      </Field>

      <Field label="Status">
        <Select
          value={value.statusGroup || "all"}
          onValueChange={(next) => onChange({ statusGroup: next === "all" ? "" : next })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tipe">
        <Select value={value.type} onValueChange={(next) => onChange({ type: next })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua tipe" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {extra ? <Field label="Client">{extra}</Field> : null}

      <Field label="Dari Tanggal">
        <Input
          type="date"
          value={value.startDate}
          max={value.endDate || undefined}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </Field>

      <Field label="Sampai Tanggal">
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
