import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteSubCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rows being deleted — 1 from the row menu, N from the toolbar's bulk
   * "Delete (N)". Both paths share this dialog and one mutation. */
  count: number;
  onConfirm: () => void;
}

/**
 * Confirmation gate for deleting sub categories (product_requirements.md
 * §4.5, lines 212-214).
 *
 * Layout follows the supplied reference exactly — leading media block, left
 * aligned header, full-bleed tinted action bar, rounded card.
 *
 * The reference's *copy* is not followed: "This action cannot be undone. This
 * will permanently delete your account from our servers." is shadcn/ui's own
 * AlertDialog documentation example, copied verbatim and never adapted — it
 * describes deleting a user account, which has nothing to do with a taxonomy
 * record. Its title ("Are you absolutely sure?") and its smiley-face icon come
 * from the same stock example; a smiling face on a destructive confirm is
 * placeholder filler, so `Trash2` is used instead. Copy and icon are the
 * deliberate deviations (§4.5 lines 190, 212); everything visual matches.
 *
 * `onConfirm` only fires on explicit confirmation.
 */
export function DeleteSubCategoryDialog({ open, onOpenChange, count, onConfirm }: DeleteSubCategoryDialogProps) {
  const isSingle = count <= 1;

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          {/* Leading media block: the header grid already re-lays itself out
              when this is present (`has-data-[slot=alert-dialog-media]`), so
              the icon spans both rows on the left and the title/description
              move to column 2 — no custom layout needed. */}
          <AlertDialogMedia className="rounded-xl bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>
            {isSingle ? "Delete this sub category?" : `Delete ${count} sub categories?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSingle
              ? "This action cannot be undone. This will permanently delete this sub category and remove it from the storefront."
              : `This action cannot be undone. This will permanently delete these ${count} sub categories and remove them from the storefront.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Full-bleed action bar: negative margins cancel the content's p-6 so
            the tinted strip reaches the card edges and rounds with it. */}
        <AlertDialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-2xl border-t border-border bg-muted/40 px-6 py-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* `variant`, not a `bg-destructive` className: AlertDialogAction
              renders `<Button asChild>` around the Radix action, so a
              caller className lands on the inner element and loses the
              specificity tie with the Button's own `bg-primary`. */}
          <AlertDialogAction
            variant="destructive"
            className="dark:bg-destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
