import { useId } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CATEGORY_OPTIONS,
  INVOICE_FROM_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PRODUCT_OPTIONS,
  USER_OPTIONS,
} from "../data/select-options.data";
import type { SelectOption, TransactionListParams } from "../types/transaction.type";

export type TransactionFilters = Pick<
  TransactionListParams,
  | "search"
  | "userId"
  | "categoryId"
  | "productId"
  | "invoiceStatus"
  | "paymentStatus"
  | "startDate"
  | "endDate"
  | "invoiceFrom"
  | "paymentMethod"
>;

export type FilterField =
  | "search"
  | "user"
  | "category"
  | "product"
  | "invoiceStatus"
  | "paymentStatus"
  | "startDate"
  | "endDate"
  | "invoiceFrom"
  | "paymentMethod";

const ALL_FILTER_FIELDS: FilterField[] = [
  "search",
  "user",
  "category",
  "product",
  "invoiceStatus",
  "paymentStatus",
  "startDate",
  "endDate",
  "invoiceFrom",
  "paymentMethod",
];

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  onChange: (patch: Partial<TransactionFilters>) => void;
  /** Reduced field set for the Manual tab — defaults to all 10 Automatic fields. */
  fields?: FilterField[];
}

const CLEAR_VALUE = "all";

function FilterSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <Box className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? CLEAR_VALUE}
        onValueChange={(next) => onChange(next === CLEAR_VALUE ? undefined : next)}
      >
        <SelectTrigger
          id={id}
          className="w-full"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLEAR_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Box>
  );
}

function FilterDate({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const date = value ? new Date(value) : undefined;

  return (
    <Box className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(next) => onChange(next ? next.toISOString() : undefined)}
          />
        </PopoverContent>
      </Popover>
    </Box>
  );
}

/**
 * The 10-field filter bar shared by both Transaction tabs (product_requirements.md
 * §4.3). Automatic renders all 10 via the `fields` default; Manual passes a
 * reduced list rather than forking this component.
 */
export function TransactionFilterBar({ filters, onChange, fields = ALL_FILTER_FIELDS }: TransactionFilterBarProps) {
  const uid = useId();
  const has = (field: FilterField) => fields.includes(field);

  return (
    <Box
      as="section"
      aria-label="Transaction Filters"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      {has("search") && (
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor={`${uid}-search`}>Search</Label>
          <Input
            id={`${uid}-search`}
            placeholder="Invoice no. or customer name"
            value={filters.search ?? ""}
            onChange={(event) => onChange({ search: event.target.value || undefined })}
          />
        </Box>
      )}
      {has("user") && (
        <FilterSelect
          id={`${uid}-user`}
          label="User"
          placeholder="All users"
          options={USER_OPTIONS}
          value={filters.userId}
          onChange={(value) => onChange({ userId: value })}
        />
      )}
      {has("category") && (
        <FilterSelect
          id={`${uid}-category`}
          label="Category"
          placeholder="All categories"
          options={CATEGORY_OPTIONS}
          value={filters.categoryId}
          onChange={(value) => onChange({ categoryId: value })}
        />
      )}
      {has("product") && (
        <FilterSelect
          id={`${uid}-product`}
          label="Product"
          placeholder="All products"
          options={PRODUCT_OPTIONS}
          value={filters.productId}
          onChange={(value) => onChange({ productId: value })}
        />
      )}
      {has("invoiceStatus") && (
        <FilterSelect
          id={`${uid}-invoice-status`}
          label="Invoice Status"
          placeholder="All statuses"
          options={INVOICE_STATUS_OPTIONS}
          value={filters.invoiceStatus}
          onChange={(value) => onChange({ invoiceStatus: value as TransactionFilters["invoiceStatus"] })}
        />
      )}
      {has("paymentStatus") && (
        <FilterSelect
          id={`${uid}-payment-status`}
          label="Payment Status"
          placeholder="All statuses"
          options={PAYMENT_STATUS_OPTIONS}
          value={filters.paymentStatus}
          onChange={(value) => onChange({ paymentStatus: value as TransactionFilters["paymentStatus"] })}
        />
      )}
      {has("startDate") && (
        <FilterDate
          id={`${uid}-start-date`}
          label="Start Date"
          value={filters.startDate}
          onChange={(value) => onChange({ startDate: value })}
        />
      )}
      {has("endDate") && (
        <FilterDate
          id={`${uid}-end-date`}
          label="End Date"
          value={filters.endDate}
          onChange={(value) => onChange({ endDate: value })}
        />
      )}
      {has("invoiceFrom") && (
        <FilterSelect
          id={`${uid}-invoice-from`}
          label="Invoice From"
          placeholder="All sources"
          options={INVOICE_FROM_OPTIONS}
          value={filters.invoiceFrom}
          onChange={(value) => onChange({ invoiceFrom: value })}
        />
      )}
      {has("paymentMethod") && (
        <FilterSelect
          id={`${uid}-payment-method`}
          label="Payment Method"
          placeholder="All methods"
          options={PAYMENT_METHOD_OPTIONS}
          value={filters.paymentMethod}
          onChange={(value) => onChange({ paymentMethod: value })}
        />
      )}
    </Box>
  );
}
