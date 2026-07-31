import { useState } from "react";
import { Eye, Lock, MoreHorizontal, Pencil, Power, RefreshCcw, SlidersHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/common/Can";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeactivateProducts, useDeleteProducts } from "../hooks/useProducts";
import type { Product } from "../types/product.type";

interface ProductRowActionsProps {
  product: Product;
}

/**
 * Row menu for the Main Products list, in the reference's order.
 *
 * Only Deactive and Delete mutate: Edit has no form frame yet (§4.6), and
 * nothing specifies what a per-row Digiflazz push, a price reveal, a price
 * lock or a price limit actually change — the fields behind the last three
 * (the `Public` padlock, "Price limits: No limit") aren't modelled either.
 * They stay listed, `<Can>`-gated and labelled, announcing what they wait on
 * rather than guessing a mutation; wiring each is a one-line change.
 */
export function ProductRowActions({ product }: ProductRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const deleteProducts = useDeleteProducts();
  const deactivateProducts = useDeactivateProducts();

  // ponytail: one stub for the five unspecced entries — a distinct handler per
  // action would be five copies of the same toast.
  const announceDeferred = (message: string) => () => toast.info(message);

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
            <DropdownMenuItem
              onSelect={announceDeferred(`Digiflazz update for ${product.name} lands with the Product Provider tab`)}
            >
              <RefreshCcw />
              Digiflazz Update
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={announceDeferred("Showing a locked price needs the price-visibility field")}>
              <Eye />
              Show Price
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={announceDeferred("Locking a price needs the price-lock field")}>
              <Lock />
              Lock Price
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={announceDeferred("Price limits land with the Add/Edit Product form")}>
              <SlidersHorizontal />
              Set Price Limit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDeactivateOpen(true)}>
              <Power />
              Deactive
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast(`Edit ${product.name} — coming soon`)}>
              <Pencil />
              Edit Product
            </DropdownMenuItem>
          </Can>
          <Can permission="products.delete">
            <DropdownMenuSeparator />
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

      <DeleteConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        icon={<Power />}
        confirmLabel="Deactivate"
        title="Deactivate this product?"
        description="This product will be marked inactive and hidden from the storefront. You can activate it again at any time."
        onConfirm={() => deactivateProducts.mutate([product.id])}
      />
    </>
  );
}
