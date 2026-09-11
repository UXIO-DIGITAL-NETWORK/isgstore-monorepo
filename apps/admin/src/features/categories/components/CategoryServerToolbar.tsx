import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryServerToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
}

/**
 * Toolbar (product_requirements.md §4.5, line 231) — search, refresh, and
 * "+ Add Category Server". No parent-category filter (this tab has no
 * parent) and no bulk button (no row selection).
 *
 * "Search Category Server" is one of the few deliberately-written strings in
 * this feature's references and is used as-is. The add button opens the
 * Add Category Server modal owned by the list page.
 */
export function CategoryServerToolbar({ search, onSearchChange, onRefresh, onAdd }: CategoryServerToolbarProps) {
  const { t } = useTranslation("categories");
  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-col gap-1.5">
        <Label htmlFor="category-server-search">{t("search")}</Label>
        <Box className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="category-server-search"
            className="w-64 rounded-xl pl-8"
            placeholder={t("searchCategoryServer")}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
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
        <Button
          className="rounded-xl"
          onClick={onAdd}
        >
          <Plus className="size-4" />{t("addCategoryServer")}</Button>
      </Box>
    </Box>
  );
}
