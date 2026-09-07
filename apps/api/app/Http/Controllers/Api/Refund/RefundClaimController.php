<?php

namespace App\Http\Controllers\Api\Refund;

use App\Actions\Auth\RegisterAction;
use App\Actions\Refund\ClaimRefundWithAccountAction;
use App\Actions\Refund\ResendRefundClaimLinkAction;
use App\Actions\Refund\ShowRefundClaimAction;
use App\Actions\Refund\SubmitRefundPayoutDetailsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Refund\RegisterAndClaimRefundRequest;
use App\Http\Requests\Refund\ResendRefundClaimRequest;
use App\Http\Requests\Refund\SubmitPayoutDetailsRequest;
use App\Models\RefundRequest;
use App\Models\User;
use App\Support\Refund\RefundClaimToken;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
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

    /**
     * Create an account and claim the refund with it, in one request.
     *
     * The token is resolved **before** the account is created: a bad link must
     * not leave a stray user row behind, and it also means the anti-enumeration
     * rules above still hold — nothing here answers a question that the token
     * did not already grant.
     *
     * Account creation goes through `RegisterAction` rather than a local
     * `User::create`, so the seeded-member-role rule and the token pair stay in
     * one place. The response therefore also signs the customer in, which is
     * what lets them watch the refund from their account afterwards.
     */
    public function register(RegisterAndClaimRefundRequest $request, string $claimToken, RegisterAction $registerAction, ClaimRefundWithAccountAction $claimAction, ShowRefundClaimAction $showAction)
    {
        $refund = RefundClaimToken::resolve($claimToken);

        if ($refund === null) {
            return $this->errorResponse('Tautan pengembalian dana tidak valid atau sudah kedaluwarsa.', 404);
        }

        $registered = $registerAction->execute($request->toDTO());

        try {
            $claimed = $claimAction->execute($refund, $registered['user']);
        } catch (RuntimeException $e) {
            // The account exists and the customer is signed in; only the claim
            // failed. Say so plainly rather than implying signup broke.
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse([
            'access_token' => $registered['access_token'],
            'refresh_token' => $registered['refresh_token'],
            'user' => $registered['user'],
            'refund' => $this->claimed($claimed),
        ], 'Akun berhasil dibuat. Pengembalian dana akan diverifikasi admin dalam 2x24 jam kerja.');
    }

    /**
     * Claim the refund with the account already signed in.
     *
     * The guest may well have had an account all along — unique email and phone
     * mean they cannot simply register again, and without this they would be
     * stuck holding a valid link they can do nothing with.
     */
    public function attach(Request $request, string $claimToken, ClaimRefundWithAccountAction $action)
    {
        $refund = RefundClaimToken::resolve($claimToken);

        if ($refund === null) {
            return $this->errorResponse('Tautan pengembalian dana tidak valid atau sudah kedaluwarsa.', 404);
        }

        /** @var User $user */
        $user = $request->user();

        try {
            $claimed = $action->execute($refund, $user);
        } catch (RuntimeException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }

        return $this->successResponse(
            $this->claimed($claimed),
            'Pengembalian dana berhasil diklaim. Admin akan memverifikasi dalam 2x24 jam kerja.'
        );
    }

    /**
     * The post-claim projection. The token is dead by now, so this cannot be
     * re-fetched through `show()` — but it must still stay as narrow as the
     * page it feeds, and must never carry the claimant's id.
     *
     * @return array<string, mixed>
     */
    private function claimed(RefundRequest $refund): array
    {
        return [
            'refund_number' => $refund->refund_number,
            'invoice_number' => $refund->transaction?->invoice_number,
            'amount' => (int) $refund->amount,
            'status' => $refund->status->value,
            'method' => $refund->method->value,
            'can_submit_payout' => false,
            'can_claim_account' => false,
            'verify_due_at' => $refund->verify_due_at?->toIso8601String(),
            'claimed_at' => $refund->claimed_at?->toIso8601String(),
        ];
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
