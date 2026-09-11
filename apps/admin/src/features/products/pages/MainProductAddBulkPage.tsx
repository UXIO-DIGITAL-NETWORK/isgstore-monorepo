import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/utils/currency";
import { useBulkCreateProducts, useSuppliers } from "../hooks/useProducts";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { useUxiolabsPriceList } from "../hooks/useProviderProducts";

interface RowState {
  selected: boolean;
  name: string;
}

/**
 * Add Product (Bulk) — pick a Supplier and Category, then select rows from the
 * supplier's catalogue (the Uxiolabs price list, the only live source today)
 * and create them as Main Products in one save. Prices are derived server-side
 * from each item's cost via the pricing rules.
 */
export default function MainProductAddBulkPage() {
  const { t } = useTranslation("products");
  const navigate = useNavigate();
  const { data: suppliers } = useSuppliers();
  const { categoryOptions } = useProductSelectOptions(undefined);
  const bulkCreate = useBulkCreateProducts();

  const [supplierId, setSupplierId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>({});

  const ready = Boolean(supplierId && categoryId);

  const { data: candidates } = useUxiolabsPriceList(
    ready ? { only_unmapped: true, per_page: 100 } : { per_page: 0 },
  );
  const items = useMemo(() => (ready ? (candidates?.data ?? []) : []), [ready, candidates]);

  const rowState = (code: string, fallbackName: string): RowState =>
    rows[code] ?? { selected: false, name: fallbackName };

  const selectedItems = useMemo(
    () =>
      items
        .filter((item) => rows[item.buyer_sku_code]?.selected)
        .map((item) => ({
          code: item.buyer_sku_code,
          name: rows[item.buyer_sku_code]?.name || item.name,
          cost: item.cost,
        })),
    [items, rows],
  );

  const onSubmit = () =>
    bulkCreate.mutate(
      { supplier_id: supplierId, category_id: categoryId, items: selectedItems },
      { onSuccess: () => navigate({ to: "/admin/products/main" }) },
    );

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading level={1} variant="section">{t("addProductBulk")}</Heading>
        <Text variant="muted">{t("bulkSubtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-6">
        <Box className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-supplier">{t("supplier")}</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="bulk-supplier">
                <SelectValue placeholder={t("selectSupplier")} />
              </SelectTrigger>
              <SelectContent>
                {(suppliers ?? []).map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="bulk-category">{t("category")}</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="bulk-category">
                <SelectValue placeholder={t("selectCategory")} />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        </Box>

        <Box className="mt-6">
          {!ready ? (
            <Box className="rounded-xl border border-border bg-muted/40 px-4 py-8 text-center">
              <Text variant="muted">{t("selectSupplierFirst")}</Text>
            </Box>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("productName")}</TableHead>
                  <TableHead className="text-right">{t("cost")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">{t("noProductsForSelection")}</TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const state = rowState(item.buyer_sku_code, item.name);
                    return (
                      <TableRow key={item.buyer_sku_code} data-state={state.selected ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={state.selected}
                            aria-label={`Select ${item.buyer_sku_code}`}
                            onCheckedChange={(value) =>
                              setRows((prev) => ({
                                ...prev,
                                [item.buyer_sku_code]: { name: state.name, selected: Boolean(value) },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="tabular-nums">{item.buyer_sku_code}</TableCell>
                        <TableCell>
                          <Input
                            aria-label={`Name for ${item.buyer_sku_code}`}
                            value={state.name}
                            onChange={(e) =>
                              setRows((prev) => ({
                                ...prev,
                                [item.buyer_sku_code]: { selected: state.selected, name: e.target.value },
                              }))
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.cost, { fractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </Box>

        <Box className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/products/main" })}>{t("cancel")}</Button>
          <Button type="button" onClick={onSubmit} disabled={bulkCreate.isPending || selectedItems.length === 0}>
            {bulkCreate.isPending ? "Saving…" : `Save${selectedItems.length ? ` (${selectedItems.length})` : ""}`}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
