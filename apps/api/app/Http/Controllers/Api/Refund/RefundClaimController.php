<?php

namespace App\Http\Controllers\Api\Refund;

use App\Actions\Refund\ResendRefundClaimLinkAction;
use App\Actions\Refund\ShowRefundClaimAction;
use App\Actions\Refund\SubmitRefundPayoutDetailsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\ResendRefundClaimRequest;
use App\Http\Requests\Refund\SubmitPayoutDetailsRequest;
use App\Support\Refund\RefundClaimToken;
use App\Traits\ApiResponse;
use RuntimeException;

/**
 * The public refund claim surface — no auth, the emailed token is the credential.
 *
 * Two rules govern everything here:
 *
 *  1. **`resend` never reveals whether it matched.** The response is byte-for-byte
 *     identical for a hit and a miss, so a leaked invoice number cannot be used
 *     to probe email addresses until one answers differently. The link goes to
 *     the contact already on the order — the same reasoning `forgot-password`
 *     uses in this codebase.
 *  2. **The projection is narrow and masked.** Whoever holds the link is
 *     unauthenticated; `ShowRefundClaimAction` builds its array field by field
 *     so nothing about the customer, the merchant or the sale's economics can
 *     leak by accident.
 */
class RefundClaimController extends Controller
{
    use ApiResponse;

    /**
     * Deliberately constant. Do not make this depend on whether a refund was
     * found — that difference is the whole attack.
     */
    private const RESEND_MESSAGE = 'Jika data cocok dengan pesanan yang menunggu pengembalian dana, kami sudah mengirim tautan klaim ke email dan WhatsApp yang terdaftar.';

    public function resend(ResendRefundClaimRequest $request, ResendRefundClaimLinkAction $action)
    {
        // The boolean is for logs and tests only; it never reaches the client.
        $action->execute(
            $request->validated('invoice_number'),
            $request->validated('contact'),
        );

        return $this->successResponse(null, self::RESEND_MESSAGE);
    }

    public function show(string $claimToken, ShowRefundClaimAction $action)
    {
        $claim = $action->execute($claimToken);

        if ($claim === null) {
            // Unknown and expired are the same answer on purpose.
            return $this->errorResponse('Tautan pengembalian dana tidak valid atau sudah kedaluwarsa.', 404);
        }

        return $this->successResponse($claim, 'Refund claim retrieved successfully');
    }

    public function submitPayoutDetails(SubmitPayoutDetailsRequest $request, string $claimToken, SubmitRefundPayoutDetailsAction $action, ShowRefundClaimAction $showAction)
    {
        $refund = RefundClaimToken::resolve($claimToken);

        if ($refund === null) {
            return $this->errorResponse('Tautan pengembalian dana tidak valid atau sudah kedaluwarsa.', 404);
        }

        try {
            $action->execute($refund, $request->toDTO(), submittedBy: 'customer');
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            $showAction->execute($claimToken),
            'Rekening tujuan berhasil disimpan. Dana akan kami transfer dalam 1×24 jam kerja.'
        );
    }
}
