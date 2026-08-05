import { Plus, RefreshCw, Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { DigiflazzType } from "../types/product.type";

interface ProviderToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  type: DigiflazzType;
  onTypeChange: (value: DigiflazzType) => void;
  onlyUnmapped: boolean;
  onOnlyUnmappedChange: (value: boolean) => void;
  onRefresh: () => void;
  selectedCount: number;
  onBulkAdd: () => void;
}

/**
 * Toolbar for the Digiflazz price list (Product Provider tab) — search, a
 * prepaid/pasca switch, an "only unmapped" toggle, and refresh. When rows are
 * selected, a permission-gated "Add selected (N)" button opens the bulk dialog.
 */
export function ProviderToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
  onlyUnmapped,
  onOnlyUnmappedChange,
  onRefresh,
  selectedCount,
  onBulkAdd,
}: ProviderToolbarProps) {
  return (
    <Box className="flex flex-col gap-3">
      <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-search">Search</Label>
            <Box className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="provider-search"
                className="w-64 rounded-xl pl-8"
                placeholder="Search product, SKU or brand"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-type">Type</Label>
            <Select
              value={type}
              onValueChange={(next) => onTypeChange(next as DigiflazzType)}
            >
              <SelectTrigger
                id="provider-type"
                className="w-40 rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepaid">Prepaid</SelectItem>
                <SelectItem value="pasca">Postpaid</SelectItem>
              </SelectContent>
            </Select>
          </Box>

          <Box className="flex items-center gap-2 pb-1">
            <Switch
              id="provider-only-unmapped"
              checked={onlyUnmapped}
              onCheckedChange={onOnlyUnmappedChange}
            />
            <Label htmlFor="provider-only-unmapped">Only unmapped</Label>
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
            >
              Refresh
            </Text>
          </Button>
        </Box>
      </Box>

      {selectedCount > 0 && (
        <Box className="flex flex-wrap items-center justify-end gap-2">
          <Can permission="products.create">
            <Button
              className="rounded-xl"
              onClick={onBulkAdd}
            >
              <Plus className="size-4" />
              Add selected ({selectedCount})
            </Button>
          </Can>
        </Box>
      )}
    </Box>
  );
}
