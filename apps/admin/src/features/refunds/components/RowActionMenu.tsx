import { useState } from "react";
import { Ban, Check, CreditCard, Eye, HandCoins, MoreVertical, UserX, Wallet } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCompleteRefund,
  useProcessRefund,
  useRejectRefund,
  useRejectRefundClaim,
  useSaveRefundPayoutDetails,
} from "../hooks/useRefunds";
import type { Refund } from "../types/refund.type";
import { CompleteRefundDialog } from "./CompleteRefundDialog";
import { PayoutDetailsDialog } from "./PayoutDetailsDialog";
import { RefundDetailDialog } from "./RefundDetailDialog";
import { RejectClaimDialog } from "./RejectClaimDialog";
import { RejectRefundDialog } from "./RejectRefundDialog";
import { VerifyCreditDialog } from "./VerifyCreditDialog";

/**
 * The queue's row menu. Which actions appear is driven by the refund's own
 * state rather than shown-and-disabled, because every one of them is a step in
 * a strict sequence: you cannot transfer before you know the account, and you
 * cannot complete a row another admin is holding.
 *
 * Two schemes share this menu. A `balance_claim` refund (the current one) is
 * verified and credited; a `manual_transfer` refund (retired, still draining)
 * is transferred by hand. A plain `balance` refund has no actions at all — it
 * settled the moment it was opened, and there is nothing left for a human to do.
 *
 * Note the two rejections are deliberately different verbs. "Reject claim"
 * turns away the account and leaves the money owed; "Reject refund" closes it
 * for good. Collapsing them would let a suspicious claim bury a real buyer's
 * refund permanently.
 */
export function RowActionMenu({ refund }: { refund: Refund }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectClaimOpen, setRejectClaimOpen] = useState(false);

  const savePayout = useSaveRefundPayoutDetails();
  const process = useProcessRefund();
  const complete = useCompleteRefund();
  const reject = useRejectRefund();
  const rejectClaim = useRejectRefundClaim();

  const isOpen = refund.status !== "COMPLETED" && refund.status !== "REJECTED";
  const isManual = refund.method === "manual_transfer";
  const isClaim = refund.method === "balance_claim";
  const awaitingAdmin = refund.status === "PENDING" || refund.status === "PROCESSING";

  const canEditPayout = isManual && (refund.status === "WAITING_DETAILS" || refund.status === "PENDING");
  const canClaim = isManual && refund.status === "PENDING" && Boolean(refund.payout);
  const canComplete = isManual && awaitingAdmin && Boolean(refund.payout);

  // A claimed refund is one an account is attached to. Until then the row is
  // waiting on the customer and there is nothing to verify.
  const isClaimed = isClaim && Boolean(refund.claimed_account);
  const canTakeForVerification = isClaimed && refund.status === "PENDING";
  const canCredit = isClaimed && awaitingAdmin;

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

            {canTakeForVerification && (
              <DropdownMenuItem onSelect={() => process.mutate(refund.id)}>
                <HandCoins />
                Claim for verification
              </DropdownMenuItem>
            )}

            {canCredit && (
              <DropdownMenuItem onSelect={() => setVerifyOpen(true)}>
                <Wallet />
                Verify &amp; credit balance
              </DropdownMenuItem>
            )}

            {isClaimed && isOpen && (
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setRejectClaimOpen(true)}
              >
                <UserX />
                Reject claim (still owed)
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

      <VerifyCreditDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        refund={refund}
        onConfirm={({ note }) => complete.mutate({ id: refund.id, note })}
        isPending={complete.isPending}
      />

      <RejectRefundDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        refundNumber={refund.refund_number}
        onConfirm={(reason) => reject.mutate({ id: refund.id, reason })}
        isPending={reject.isPending}
      />

      <RejectClaimDialog
        open={rejectClaimOpen}
        onOpenChange={setRejectClaimOpen}
        refundNumber={refund.refund_number}
        onConfirm={(reason) => rejectClaim.mutate({ id: refund.id, reason })}
        isPending={rejectClaim.isPending}
      />
    </>
  );
}
