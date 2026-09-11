import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo: string;
  onConfirm: () => void;
}

/**
 * Confirmation gate for the destructive "Delete" row action
 * (product_requirements.md §4.3 — hard-delete semantics flagged as worth
 * confirming with the team, not blocking). `onConfirm` only fires on
 * explicit confirmation, never on open.
 */
export function DeleteConfirmDialog({ open, onOpenChange, invoiceNo, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useTranslation("transactions");
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction {invoiceNo}?</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          {/* `variant` + an explicit dark override, matching the categories
              delete dialogs — the bare `bg-destructive` className this used
              to carry never won, so this button rendered as the default
              primary. See AlertDialogAction in components/ui/alert-dialog. */}
          <AlertDialogAction
            variant="destructive"
            className="dark:bg-destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >{t("delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
