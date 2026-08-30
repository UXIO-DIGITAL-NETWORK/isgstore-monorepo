import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  Lock,
  MoreVertical,
  Pencil,
  RefreshCcw,
  Rocket,
  SlidersHorizontal,
  Unlock,
} from "lucide-react";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Text } from "@/components/common/Text";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteProducts,
  useUxiotopupUpdateProducts,
  useLockProducts,
  useRestoreProduct,
  useSetProductPublished,
  useShowProducts,
} from "../hooks/useProducts";
import type { Product } from "../types/product.type";
import { MainProductFormDialog } from "./MainProductFormDialog";

interface ProductRowActionsProps {
  product: Product;
}

/**
 * Row menu for the Main Products list, in the reference's order. Each action is
 * wired: Uxiotopup Update / Show Price / Lock Price go through a confirm dialog,
 * Set Price Limit opens its page, and the lifecycle toggle / Edit / Delete are
 * unchanged.
 * The single-row paths reuse the bulk hooks with a one-id selection.
 *
 * The three reversible items — publishing, price lock, price visibility — each
 * read the row's own state and offer the direction that would change something.
 * A locked row is offered "Unlock Price"; a live one, "Unpublish".
 *
 * Publish replaced Activate. Activate wrote the product's `status` and nothing
 * else, while a product is only sellable when an active supplier mapping backs
 * it too — so it could report a product as live that the storefront could not
 * see, and there was no second verb on this screen to finish the job. One verb
 * moves both halves now, and `can_publish` carries the server's own reason when
 * it cannot.
 *
 * An archived row is a different thing entirely: nothing about it can be edited,
 * so the menu collapses to Restore.
 */
export function ProductRowActions({ product }: ProductRowActionsProps) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [uxiotopupOpen, setUxiotopupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteProducts = useDeleteProducts();
  const setProductPublished = useSetProductPublished();
  const restoreProduct = useRestoreProduct();
  const lockProducts = useLockProducts();
  const showProducts = useShowProducts();
  const uxiotopupUpdate = useUxiotopupUpdateProducts();

  // Each toggle names what the click would do, not what the row currently is.
  const isArchived = product.publish_state === "archived";
  const nextPublished = product.publish_state !== "published";
  const nextLocked = !product.is_price_locked;
  const nextHidden = !product.is_price_hidden;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${product.name}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          {/* An archived product has nothing to price, publish or edit — the one
              thing that applies to it is bringing it back. */}
          {isArchived ? (
            <Can permission="products.edit">
              <DropdownMenuItem onSelect={() => restoreProduct.mutate(product.id)}>
                <ArchiveRestore />
                Restore
              </DropdownMenuItem>
            </Can>
          ) : (
            <Can permission="products.edit">
              <DropdownMenuItem onSelect={() => setUxiotopupOpen(true)}>
                <RefreshCcw />
                Uxiotopup Update
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowOpen(true)}>
                {nextHidden ? <EyeOff /> : <Eye />}
                {nextHidden ? "Hide Price" : "Show Price"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLockOpen(true)}>
                {nextLocked ? <Lock /> : <Unlock />}
                {nextLocked ? "Lock Price" : "Unlock Price"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => navigate({ to: "/admin/products/main/set-price-limit", search: { id: product.id } })}
              >
                <SlidersHorizontal />
                Set Price Limit
              </DropdownMenuItem>
              {/* Disabled rather than hidden, with the server's own reason inside
                the item: a disabled DropdownMenuItem swallows pointer events, so
                a tooltip on it would never fire. Same pattern as the pool's
                Promote. */}
              <DropdownMenuItem
                disabled={nextPublished && !product.can_publish}
                onSelect={() => setPublishOpen(true)}
              >
                {nextPublished ? <Rocket /> : <Archive />}
                <Box className="flex flex-col items-start">
                  {nextPublished ? "Publish" : "Unpublish"}
                  {nextPublished && product.publish_blocked_reason && (
                    <Text
                      as="span"
                      variant="small"
                      className="text-muted-foreground"
                    >
                      {product.publish_blocked_reason}
                    </Text>
                  )}
                </Box>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil />
                Edit Product
              </DropdownMenuItem>
            </Can>
          )}
          {!isArchived && (
            <Can permission="products.delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Archive />
                Archive
              </DropdownMenuItem>
            </Can>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={uxiotopupOpen}
        onOpenChange={setUxiotopupOpen}
        icon={<RefreshCcw />}
        confirmLabel="Update"
        title="Update this product?"
        description="Re-pull this product's selling prices from its supplier cost. A locked price is left unchanged."
        onConfirm={() => uxiotopupUpdate.mutate([product.id])}
      />

      <DeleteConfirmDialog
        open={showOpen}
        onOpenChange={setShowOpen}
        icon={nextHidden ? <EyeOff /> : <Eye />}
        confirmLabel={nextHidden ? "Hide" : "Show"}
        title={nextHidden ? "Hide price for this product?" : "Show price for this product?"}
        description={
          nextHidden
            ? "The price will be hidden on the storefront. The product itself stays listed."
            : "The price will be visible on the storefront."
        }
        onConfirm={() => showProducts.mutate({ ids: [product.id], hidden: nextHidden })}
      />

      <DeleteConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        icon={nextLocked ? <Lock /> : <Unlock />}
        confirmLabel={nextLocked ? "Lock" : "Unlock"}
        title={nextLocked ? "Lock this price?" : "Unlock this price?"}
        description={
          nextLocked
            ? "The supplier sync will stop overwriting this product's price until it is unlocked."
            : "The supplier sync will resume overwriting this product's price from its cost."
        }
        onConfirm={() => lockProducts.mutate({ ids: [product.id], locked: nextLocked })}
      />

      {/* Same shared dialog and same mutation as the toolbar's bulk archive —
          only the set of ids differs. The copy no longer claims the action
          cannot be undone, because it can: the row is kept so its order history
          keeps resolving, and Restore brings it back. */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        icon={<Archive />}
        confirmLabel="Archive"
        title="Archive this product?"
        description="It leaves the storefront and the catalogue, and its provider SKU returns to the pool. Past orders keep their details, and you can restore it from the Archived filter."
        onConfirm={() => deleteProducts.mutate([product.id])}
      />

      <DeleteConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        icon={nextPublished ? <Rocket /> : <Archive />}
        confirmLabel={nextPublished ? "Publish" : "Unpublish"}
        title={nextPublished ? "Publish this product?" : "Unpublish this product?"}
        description={
          nextPublished
            ? "It goes on sale on the storefront, served by its active supplier. Its price visibility is left as it was."
            : "It leaves the storefront and stops being orderable. Nothing else changes, and you can publish it again at any time."
        }
        onConfirm={() => setProductPublished.mutate({ ids: [product.id], published: nextPublished })}
      />

      <MainProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        productId={product.id}
      />
    </>
  );
}
