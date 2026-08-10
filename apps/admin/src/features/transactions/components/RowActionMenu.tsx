import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { Eye, History, MoreHorizontal, Pencil, Receipt, RotateCcw, RotateCw, Send, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/common/Can";
import { ENV, API_VERSION } from "@/config/env";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteTransaction,
  useRefund,
  useResendCallback,
  useResendReceipt,
  useRetryInvoice,
} from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction.type";
import { ActivityLogDialog } from "./ActivityLogDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { RefundDialog } from "./RefundDialog";

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
  const [activityOpen, setActivityOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const resendCallback = useResendCallback();
  const retryInvoice = useRetryInvoice();
  const resendReceipt = useResendReceipt();
  const deleteTransaction = useDeleteTransaction();
  const refund = useRefund();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Derived from the current tab's pathname rather than hardcoded, so the
  // same menu reaches the Manual tab's mirror and the unauthenticated preview
  // without special-casing — same trick as CategoryToolbar's "+ Add Category".
  const editHref = `${pathname.replace(/\/$/, "")}/${transaction.invoice_no}/edit`;

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
          <DropdownMenuItem onSelect={() => setActivityOpen(true)}>
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
          <DropdownMenuItem
            onSelect={() =>
              window.open(
                // Strip a trailing slash so ".../api/" doesn't become ".../api//v1".
                `${ENV.API_BASE_URL.replace(/\/+$/, "")}${API_VERSION}/invoices/${transaction.invoice_no}/download`,
                "_blank",
                "noopener",
              )
            }
          >
            <Receipt />
            View Invoice
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => resendReceipt.mutate(transaction.id)}>
            <Send />
            Resend Receipt
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => toast("Transaction Detail — coming soon")}>
            <Eye />
            Transaction Detail
          </DropdownMenuItem>
          <Can permission="transactions.edit">
            <DropdownMenuItem onSelect={() => navigate({ to: editHref as unknown as string })}>
              <Pencil />
              Edit Invoice
            </DropdownMenuItem>
          </Can>
          <DropdownMenuSeparator />
          <Can permission="transactions.refund">
            <DropdownMenuItem onSelect={() => setRefundOpen(true)}>
              <RotateCcw />
              Refund
            </DropdownMenuItem>
          </Can>
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

      <ActivityLogDialog
        transactionId={transaction.id}
        open={activityOpen}
        onOpenChange={setActivityOpen}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        invoiceNo={transaction.invoice_no}
        onConfirm={() => deleteTransaction.mutate(transaction.id)}
      />
      <RefundDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        invoiceNo={transaction.invoice_no}
        isPending={refund.isPending}
        onConfirm={(reason) => refund.mutate({ id: transaction.id, reason })}
      />
    </>
  );
}
