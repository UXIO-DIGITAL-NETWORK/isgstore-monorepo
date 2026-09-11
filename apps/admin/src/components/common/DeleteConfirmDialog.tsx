import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  /** Names the action on the confirm button. Defaults to "Delete". */
  confirmLabel?: string;
  /** Header glyph. Defaults to the trash icon. */
  icon?: ReactNode;
}

/**
 * The one delete confirmation for every tab in this feature
 * (product_requirements.md §4.5). Generalised from the Sub Category dialog
 * once Category Type became the third tab to need it.
 *
 * Every reference frame so far ships shadcn/ui's own AlertDialog docs example
 * verbatim — "This action cannot be undone. This will permanently delete your
 * account from our servers." — under a title taken from the same snippet
 * ("Are you absolutely sure?"). Seeing it three times confirms it is one
 * never-customized dialog in the source design, not three separate mistakes,
 * so the correction lives here rather than being re-argued per tab. Callers
 * pass wording for their own entity; the structure, the destructive styling
 * and the confirm label are fixed.
 *
 * Confirm label is **"Delete"** — standardised 2026-07-27. The Sub Category
 * reference said "Continue" for the same button; "Delete" names the action.
 * `confirmLabel`/`icon` let the other irreversible-enough action that needs
 * this same structure name itself (Main Products' bulk "Deactivate").
 *
 * `onConfirm` only fires on explicit confirmation.
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel,
  icon = <Trash2 />,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation("common");
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          {/* The header grid re-lays itself out when a media slot is present
              (`has-data-[slot=alert-dialog-media]`), so the icon spans both
              rows on the left with the text in column 2. */}
          <AlertDialogMedia className="rounded-xl bg-destructive/10 text-destructive">{icon}</AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* Full-bleed action bar: negative margins cancel the content's p-6 so
            the tinted strip reaches the card edges and rounds with it. */}
        <AlertDialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-2xl border-t border-border bg-muted/40 px-6 py-4">
          <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="dark:bg-destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel ?? t("confirm.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
