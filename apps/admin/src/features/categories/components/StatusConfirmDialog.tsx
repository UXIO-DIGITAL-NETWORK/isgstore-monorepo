import { useTranslation } from "react-i18next";
import { Power } from "lucide-react";

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

interface StatusConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "activate" | "deactivate";
  onConfirm: () => void;
}

// Keys, not sentences: a module constant would freeze whichever language was
// loaded at import.
const COPY = {
  deactivate: {
    titleKey: "deactivateTypeTitle",
    descriptionKey: "deactivateTypeDescription",
    confirmKey: "deactivate",
  },
  activate: {
    titleKey: "activateTypeTitle",
    descriptionKey: "activateTypeDescription",
    confirmKey: "activate",
  },
} as const;

/**
 * Confirmation for the reversible status toggle (product_requirements.md
 * §4.5) — deliberately **not** the delete dialog with different words.
 *
 * The reference put the same "This action cannot be undone. This will
 * permanently delete your account from our servers." body under a title
 * reading "Are you absolutely sure deactive?" — copy that contradicts both
 * the action and its own title. Deactivating is undoable, so this dialog says
 * so, uses a neutral `Power` icon on a muted rather than destructive
 * background, and confirms with the default button variant. Nothing here is
 * red, and nothing claims permanence.
 */
export function StatusConfirmDialog({ open, onOpenChange, action, onConfirm }: StatusConfirmDialogProps) {
  const { t } = useTranslation("categories");
  const copy = COPY[action];

  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogMedia className="rounded-xl bg-muted text-muted-foreground">
            <Power />
          </AlertDialogMedia>
          <AlertDialogTitle>{t(copy.titleKey)}</AlertDialogTitle>
          <AlertDialogDescription>{t(copy.descriptionKey)}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-2xl border-t border-border bg-muted/40 px-6 py-4">
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {t(copy.confirmKey)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
