import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { useBulkAddUxiotopupProducts } from "../hooks/useProviderProducts";

interface BulkAddProviderDialogProps {
  skus: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

/**
 * Adds many selected SKUs under one shared category. Selling prices are derived
 * server-side per SKU from the pricing rules, so this form only collects the
 * category (required), an optional sub-category, and the storefront status.
 */
export function BulkAddProviderDialog({ skus, open, onOpenChange, onDone }: BulkAddProviderDialogProps) {
  const bulkAdd = useBulkAddUxiotopupProducts();
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [status, setStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { categoryOptions, subCategoryOptions } = useProductSelectOptions(categoryId || undefined);

  const handleSubmit = () => {
    if (!categoryId) {
      setError("Choose a category");
      return;
    }
    setError(null);
    bulkAdd.mutate(
      {
        category_id: categoryId,
        sub_category_id: subCategoryId || null,
        status,
        buyer_sku_codes: skus,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onDone();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add {skus.length} products</DialogTitle>
          <DialogDescription>
            The selected SKUs are added under one category. Prices are derived from your pricing rules; you can adjust
            them afterwards in Main Products.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-bulk-category">Category</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
            >
              <SelectTrigger
                id="provider-bulk-category"
                className="w-full rounded-xl"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && (
              <Text
                variant="small"
                className="text-destructive"
              >
                {error}
              </Text>
            )}
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="provider-bulk-subcategory">Sub-category (optional)</Label>
            <Select
              value={subCategoryId}
              onValueChange={setSubCategoryId}
              disabled={!categoryId || subCategoryOptions.length === 0}
            >
              <SelectTrigger
                id="provider-bulk-subcategory"
                className="w-full rounded-xl"
              >
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {subCategoryOptions.map((option) => (
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

          <Box className="flex items-center gap-2">
            <Switch
              id="provider-bulk-status"
              checked={status}
              onCheckedChange={setStatus}
            />
            <Label htmlFor="provider-bulk-status">Active on the storefront</Label>
          </Box>
        </Box>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={bulkAdd.isPending}
            onClick={handleSubmit}
          >
            {bulkAdd.isPending ? "Adding..." : `Add ${skus.length} products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
