<?php

namespace App\Http\Controllers\Api\Member;

use App\Http\Controllers\Controller;
use App\Models\RefundRequest;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * "Where is my refund?", for the account that claimed it.
 *
 * This exists because claiming a refund deliberately does **not** rewrite
 * `transactions.user_id`: that column drives merchant/member attribution and
 * every report, and retro-assigning it would move a guest sale into a member's
 * history for a period when the account did not exist. The consequence is that
 * the failed order never appears in "Riwayat Pesanan", so without this endpoint
 * the customer's only trace of the money would be a balance mutation appearing
 * out of nowhere days later.
 *
 * Scoped to `claimed_user_id`, never `user_id`: a member whose own order was
 * refunded was already credited instantly and sees it in their balance history.
 * This list is specifically the claims — the ones with a promise attached.
 */
class MemberRefundController extends Controller
{
    use ApiResponse;

    public function index(Request $request)
    {
        $refunds = RefundRequest::query()
            ->where('claimed_user_id', $request->user()->id)
            ->with(['transaction:id,invoice_number,product_id', 'transaction.product:id,name'])
            ->latest('id')
            ->paginate((int) $request->integer('per_page', 15));

        // Hand-built rather than reusing RefundRequestResource: that one is the
        // admin shape and carries payout accounts, internal notes and the
        // merchant's side of the sale. None of that is the customer's to read.
        $refunds->getCollection()->transform(fn (RefundRequest $refund) => [
            'refund_number' => $refund->refund_number,
            'invoice_number' => $refund->transaction?->invoice_number,
            'product' => $refund->transaction?->product?->name,
            'amount' => (int) $refund->amount,
            'status' => $refund->status->value,
            'claimed_at' => $refund->claimed_at?->toIso8601String(),
            // What we promised. The page counts down to this.
            'verify_due_at' => $refund->verify_due_at?->toIso8601String(),
            'refunded_at' => $refund->refunded_at?->toIso8601String(),
            'reject_reason' => $refund->reject_reason,
            'created_at' => $refund->created_at?->toIso8601String(),
        ]);

        return $this->paginatedResponse(
            JsonResource::collection($refunds),
            'Refunds retrieved successfully'
        );
    }
}
