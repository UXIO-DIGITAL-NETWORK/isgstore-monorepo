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

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  onConfirm: () => void;
}

/** Confirmation gate for the destructive "Delete" row action — `onConfirm`
 * only fires on explicit confirmation, never on open. */
export function DeleteCategoryDialog({ open, onOpenChange, categoryName, onConfirm }: DeleteCategoryDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {categoryName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the category and its order-form field definitions. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {/* `variant`, not a `bg-destructive` className — see
              DeleteSubCategoryDialog: a caller className lands on the inner
              Radix action and loses the tie with the Button's `bg-primary`,
              so this button rendered near-black instead of red. */}
          <AlertDialogAction
            variant="destructive"
            className="dark:bg-destructive"
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
