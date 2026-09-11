import { useTranslation } from "react-i18next";
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
  PROVIDER_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PRODUCT_OPTIONS,
  USER_OPTIONS,
} from "../data/select-options.data";
import type { KeyedSelectOption, SelectOption, TransactionListParams } from "../types/transaction.type";

export type TransactionFilters = Pick<
  TransactionListParams,
  | "search"
  | "userId"
  | "categoryId"
  | "productId"
  | "invoiceStatus"
  | "providerStatus"
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
  | "providerStatus"
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
  "providerStatus",
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
  options: SelectOption[] | KeyedSelectOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  const { t } = useTranslation("transactions");
  return (
    <Box className="flex flex-col gap-2.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? CLEAR_VALUE}
        onValueChange={(next) => onChange(next === CLEAR_VALUE ? undefined : next)}
      >
        <SelectTrigger
          id={id}
          className="w-full rounded-xl"
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
              {"labelKey" in option ? t(option.labelKey) : option.label}
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
    <Box className="flex flex-col gap-2.5">
      <Label htmlFor={id}>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-start rounded-xl font-normal", !date && "text-muted-foreground")}
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
  const { t } = useTranslation("transactions");
  const uid = useId();
  const has = (field: FilterField) => fields.includes(field);

  return (
    <Box
      as="section"
      aria-label={t("filtersAria")}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5"
    >
      {has("search") && (
        <Box className="flex flex-col gap-2.5">
          <Label htmlFor={`${uid}-search`}>{t("search")}</Label>
          <Input
            id={`${uid}-search`}
            className="rounded-xl"
            placeholder={t("searchPlaceholder")}
            value={filters.search ?? ""}
            onChange={(event) => onChange({ search: event.target.value || undefined })}
          />
        </Box>
      )}
      {has("user") && (
        <FilterSelect
          id={`${uid}-user`}
          label={t("colUser")}
          placeholder={t("allUsers")}
          options={USER_OPTIONS}
          value={filters.userId}
          onChange={(value) => onChange({ userId: value })}
        />
      )}
      {has("category") && (
        <FilterSelect
          id={`${uid}-category`}
          label={t("category")}
          placeholder={t("allCategories")}
          options={CATEGORY_OPTIONS}
          value={filters.categoryId}
          onChange={(value) => onChange({ categoryId: value })}
        />
      )}
      {has("product") && (
        <FilterSelect
          id={`${uid}-product`}
          label={t("product")}
          placeholder={t("allProducts")}
          options={PRODUCT_OPTIONS}
          value={filters.productId}
          onChange={(value) => onChange({ productId: value })}
        />
      )}
      {has("invoiceStatus") && (
        <FilterSelect
          id={`${uid}-invoice-status`}
          label={t("invoiceStatus")}
          placeholder={t("allStatuses")}
          options={INVOICE_STATUS_OPTIONS}
          value={filters.invoiceStatus}
          onChange={(value) => onChange({ invoiceStatus: value as TransactionFilters["invoiceStatus"] })}
        />
      )}
      {has("providerStatus") && (
        <FilterSelect
          id={`${uid}-provider-status`}
          label={t("providerStatus")}
          placeholder={t("allStatuses")}
          options={PROVIDER_STATUS_OPTIONS}
          value={filters.providerStatus}
          onChange={(value) => onChange({ providerStatus: value as TransactionFilters["providerStatus"] })}
        />
      )}
      {has("paymentStatus") && (
        <FilterSelect
          id={`${uid}-payment-status`}
          label={t("paymentStatus")}
          placeholder={t("allStatuses")}
          options={PAYMENT_STATUS_OPTIONS}
          value={filters.paymentStatus}
          onChange={(value) => onChange({ paymentStatus: value as TransactionFilters["paymentStatus"] })}
        />
      )}
      {has("startDate") && (
        <FilterDate
          id={`${uid}-start-date`}
          label={t("startDate")}
          value={filters.startDate}
          onChange={(value) => onChange({ startDate: value })}
        />
      )}
      {has("endDate") && (
        <FilterDate
          id={`${uid}-end-date`}
          label={t("endDate")}
          value={filters.endDate}
          onChange={(value) => onChange({ endDate: value })}
        />
      )}
      {has("invoiceFrom") && (
        <FilterSelect
          id={`${uid}-invoice-from`}
          label={t("invoiceFrom")}
          placeholder={t("allSources")}
          options={INVOICE_FROM_OPTIONS}
          value={filters.invoiceFrom}
          onChange={(value) => onChange({ invoiceFrom: value })}
        />
      )}
      {has("paymentMethod") && (
        <FilterSelect
          id={`${uid}-payment-method`}
          label={t("paymentMethod")}
          placeholder={t("allMethods")}
          options={PAYMENT_METHOD_OPTIONS}
          value={filters.paymentMethod}
          onChange={(value) => onChange({ paymentMethod: value })}
        />
      )}
    </Box>
  );
}
