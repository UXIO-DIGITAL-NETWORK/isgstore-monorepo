import { useState } from "react";
import { Ban, Check, CreditCard, Eye, HandCoins, MoreVertical } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCompleteRefund, useProcessRefund, useRejectRefund, useSaveRefundPayoutDetails } from "../hooks/useRefunds";
import type { Refund } from "../types/refund.type";
import { CompleteRefundDialog } from "./CompleteRefundDialog";
import { PayoutDetailsDialog } from "./PayoutDetailsDialog";
import { RefundDetailDialog } from "./RefundDetailDialog";
import { RejectRefundDialog } from "./RejectRefundDialog";

/**
 * The queue's row menu. Which actions appear is driven by the refund's own
 * state rather than shown-and-disabled, because every one of them is a step in
 * a strict sequence: you cannot transfer before you know the account, and you
 * cannot complete a row another admin is holding.
 *
 * A `balance` refund has no actions at all — it settled the moment it was
 * opened, and there is nothing left for a human to do.
 */
export function RowActionMenu({ refund }: { refund: Refund }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const savePayout = useSaveRefundPayoutDetails();
  const process = useProcessRefund();
  const complete = useCompleteRefund();
  const reject = useRejectRefund();

  const isOpen = refund.status !== "COMPLETED" && refund.status !== "REJECTED";
  const isManual = refund.method === "manual_transfer";
  const canEditPayout = isManual && (refund.status === "WAITING_DETAILS" || refund.status === "PENDING");
  const canClaim = isManual && refund.status === "PENDING" && Boolean(refund.payout);
  const canComplete =
    isManual && (refund.status === "PENDING" || refund.status === "PROCESSING") && Boolean(refund.payout);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${refund.refund_number}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <DropdownMenuItem onSelect={() => setDetailOpen(true)}>
            <Eye />
            View details
          </DropdownMenuItem>

          <Can permission="refunds.manage">
            {canEditPayout && (
              <DropdownMenuItem onSelect={() => setPayoutOpen(true)}>
                <CreditCard />
                {refund.payout ? "Edit payout details" : "Add payout details"}
              </DropdownMenuItem>
            )}

            {canClaim && (
              <DropdownMenuItem onSelect={() => process.mutate(refund.id)}>
                <HandCoins />
                Claim for transfer
              </DropdownMenuItem>
            )}

            {canComplete && (
              <DropdownMenuItem onSelect={() => setCompleteOpen(true)}>
                <Check />
                Mark as transferred
              </DropdownMenuItem>
            )}

            {isOpen && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setRejectOpen(true)}
                >
                  <Ban />
                  Reject refund
                </DropdownMenuItem>
              </>
            )}
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <RefundDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        refundId={refund.id}
      />

      <PayoutDetailsDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        refund={refund}
        onConfirm={(payload) => savePayout.mutate({ id: refund.id, payload })}
        isPending={savePayout.isPending}
      />

      <CompleteRefundDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        refund={refund}
        onConfirm={({ proof, note }) => complete.mutate({ id: refund.id, proof, note })}
        isPending={complete.isPending}
      />

      <RejectRefundDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        refundNumber={refund.refund_number}
        onConfirm={(reason) => reject.mutate({ id: refund.id, reason })}
        isPending={reject.isPending}
      />
    </>
  );
}
