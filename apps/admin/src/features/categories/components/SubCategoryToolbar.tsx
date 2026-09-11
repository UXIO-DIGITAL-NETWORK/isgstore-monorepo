import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoryList } from "../hooks/useCategories";

const CLEAR_VALUE = "all";
const CATEGORY_OPTIONS_PAGE_SIZE = 100;

interface SubCategoryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryId?: string;
  onCategoryChange: (value: string | undefined) => void;
  onRefresh: () => void;
  onAdd: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

/**
 * Toolbar (product_requirements.md §4.5, line 206) — "Search sub categories"
 * (the one deliberately-written placeholder in this feature's references, kept
 * verbatim), a parent-category filter, refresh, and "+ Add Sub Category".
 * A destructive "Delete (N)" appears once rows are checked.
 *
 * Field labels are visible, matching the Category tab's toolbar — the
 * reference shows none, but two sibling tabs with differently-labelled
 * toolbars read as inconsistent. The add button opens the Add Sub Category
 * modal owned by the list page.
 */
export function SubCategoryToolbar({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  onRefresh,
  onAdd,
  selectedCount,
  onBulkDelete,
}: SubCategoryToolbarProps) {
  const { t } = useTranslation("categories");
  // ponytail: one page of categories is plenty for a filter dropdown against
  // mock data; swap to a searchable/paged combobox if the real list grows.
  const { data: categories } = useCategoryList({ per_page: CATEGORY_OPTIONS_PAGE_SIZE });

  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="sub-category-search">{t("search")}</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="sub-category-search"
              className="w-64 rounded-xl pl-8"
              placeholder={t("searchSubCategories")}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="sub-category-parent-filter">{t("category")}</Label>
          {/* `""` (not the clear sentinel) when unfiltered, so Radix shows the
              placeholder rather than the "All categories" item's label. */}
          <Select
            value={categoryId ?? ""}
            onValueChange={(next) => onCategoryChange(next === CLEAR_VALUE ? undefined : next)}
          >
            <SelectTrigger
              id="sub-category-parent-filter"
              className="w-56 rounded-xl"
            >
              <SelectValue placeholder={t("typeToSearchCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>{t("allCategories")}</SelectItem>
              {(categories?.data ?? []).map((category) => (
                <SelectItem
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      </Box>

      <Box className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={onRefresh}
        >
          <RefreshCw className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >{t("refresh")}</Text>
        </Button>
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            // `dark:bg-destructive` overrides the variant's own
            // `dark:bg-destructive/60`, which renders washed out next to the
            // row menu's full-strength red Delete. tailwind-merge (via the
            // Button's `cn`) drops the /60 rule, so this wins deterministically
            // rather than on stylesheet order.
            className="rounded-xl bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
            onClick={onBulkDelete}
          >
            <Trash2 className="size-4" />
            Delete ({selectedCount})
          </Button>
        )}
        <Button
          className="rounded-xl"
          onClick={onAdd}
        >
          <Plus className="size-4" />{t("addSubCategory")}</Button>
      </Box>
    </Box>
  );
}
