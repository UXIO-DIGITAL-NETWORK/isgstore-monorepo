import { useState } from "react";
import { Eye, History, MoreHorizontal, Pencil, Receipt, RotateCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteTransaction, useResendCallback, useRetryInvoice } from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction.type";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { EditTransactionDialog } from "./EditTransactionDialog";

interface RowActionMenuProps {
  transaction: Transaction;
  /**
   * Automatic's menu includes the two provider-callback actions; Manual has
   * no provider to call back to, so it hides them (product_requirements.md
   * §4.3 — Manual's exact shape is provisional pending a real design).
   */
  showCallbackActions?: boolean;
}

/**
 * Same 7-item menu for every row regardless of success/failed status — the
 * flat reference only shows it open on a failed row and Figma wasn't
 * reachable this session to confirm a variant, so one consistent menu is
 * built rather than inventing a second shape.
 */
export function RowActionMenu({ transaction, showCallbackActions = true }: RowActionMenuProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const resendCallback = useResendCallback();
  const retryInvoice = useRetryInvoice();
  const deleteTransaction = useDeleteTransaction();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${transaction.invoice_no}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <DropdownMenuItem onSelect={() => toast("Activity Log — coming soon")}>
            <History />
            Activity Log
          </DropdownMenuItem>
          {showCallbackActions && (
            <>
              <DropdownMenuItem onSelect={() => resendCallback.mutate(transaction.id)}>
                <Upload />
                Resend Callback
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => retryInvoice.mutate(transaction.id)}>
                <RotateCw />
                Retry Invoice
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onSelect={() => toast("View Invoice — coming soon")}>
            <Receipt />
            View Invoice
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Transaction Detail — coming soon")}>
            <Eye />
            Transaction Detail
          </DropdownMenuItem>
          <Can permission="transactions.edit">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              Edit Invoice
            </DropdownMenuItem>
          </Can>
          <DropdownMenuSeparator />
          <Can permission="transactions.delete">
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

      <EditTransactionDialog
        transaction={transaction}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        invoiceNo={transaction.invoice_no}
        onConfirm={() => deleteTransaction.mutate(transaction.id)}
      />
    </>
  );
}
