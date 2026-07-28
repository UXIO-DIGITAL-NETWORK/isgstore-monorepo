import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/common/Can";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteProducts } from "../hooks/useProducts";
import type { Product } from "../types/product.type";

interface ProductRowActionsProps {
  product: Product;
}

/**
 * Row menu for the Main Products list. Two items, matching the reference.
 *
 * Edit is a toast stub: this round ships the list only, and the Add/Edit form
 * has no reference frame yet (§4.6). It stays `<Can>`-gated and correctly
 * labelled so wiring it later is a one-line change, rather than being hidden
 * and needing to be rediscovered.
 */
export function ProductRowActions({ product }: ProductRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteProducts = useDeleteProducts();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${product.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="products.edit">
            <DropdownMenuItem onSelect={() => toast(`Edit ${product.name} — coming soon`)}>
              <Pencil />
              Edit Product
            </DropdownMenuItem>
          </Can>
          <Can permission="products.delete">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Same shared dialog and same mutation as the toolbar's bulk delete —
          only the set of ids differs. The reference ships shadcn's own
          "permanently delete your account" example copy yet again; real
          wording is passed in rather than restyling the boilerplate. */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description="This action cannot be undone. This will permanently delete this product and remove all of its variants from the storefront."
        onConfirm={() => deleteProducts.mutate([product.id])}
      />
    </>
  );
}
