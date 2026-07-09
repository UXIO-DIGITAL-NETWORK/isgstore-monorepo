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
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete transaction {invoiceNo}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the transaction record. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
