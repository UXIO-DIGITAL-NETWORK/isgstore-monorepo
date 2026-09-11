<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use App\Actions\Withdrawal\HandleDisbursementCallbackAction;
use App\DTOs\Withdrawal\DisbursementCallbackDTO;
use App\Http\Controllers\Controller;
use App\Services\Payment\MonetapayService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Monetapay payout merchant callback — POST /disbursement/merchant/callback (7.4.2).
 *
 * Same envelope + crypto as the pay-in callback: decrypt `en_data`, verify the
 * Double MD5 signature, then hand the final payout state to the action. Returns
 * HTTP 200 on success so Monetapay stops retrying; only a decrypt/signature
 * failure (or an unknown order) yields a non-200.
 */
class DisbursementCallbackController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly HandleDisbursementCallbackAction $action,
    ) {}

    public function __invoke(Request $request)
    {
        Log::channel('monetapay')->info('Monetapay Disbursement Callback Hit', $request->all());

        try {
            // Envelope: { "data": { "en_data": "...", "partner_key": "...", "mch_order_no": "..." } }
            $validated = $request->validate([
                'data' => ['required', 'array'],
                'data.en_data' => ['required', 'string'],
                'data.partner_key' => ['nullable', 'string'],
                'data.mch_order_no' => ['nullable', 'string'],
            ]);

            // Decrypt only the en_data blob, then verify the signature over it.
            $decrypted = $this->monetapayService->decryptPayload($validated['data']['en_data']);

            if (! $this->monetapayService->verifyCallbackSignature($decrypted)) {
                Log::channel('monetapay')->warning('Disbursement callback signature mismatch', [
                    'mch_order_no' => $validated['data']['mch_order_no'] ?? null,
                    'decrypted' => $decrypted,
                ]);
                throw new Exception('Signature verification failed.');
            }

            // Logged, not rejected — same reasoning as the pay-in callback: the
            // payout is matched by our own mch_order_no, so a merchant mismatch is
            // a config alarm, not grounds for dropping a settlement result.
            if ($this->monetapayService->callbackTargetsAnotherMerchant($decrypted)) {
                Log::channel('monetapay')->warning('Disbursement callback names a different sub-merchant', [
                    'mch_order_no' => $decrypted['mch_order_no'] ?? null,
                    'callback_sub_mch_id' => $decrypted['sub_mch_id'] ?? null,
                    'configured_sub_mch_id' => $this->monetapayService->subMchId(),
                ]);
            }

            Log::channel('monetapay')->info('Monetapay Disbursement Decrypted Payload', $decrypted);

            $this->action->execute(new DisbursementCallbackDTO(
                outNo: (string) ($decrypted['mch_order_no'] ?? ''),
                status: (string) ($decrypted['status'] ?? ''),
                rawPayload: $decrypted,
            ));

            // Code 200 = reception successful (per the 7.4.2 spec).
            return response()->json(['code' => 0, 'message' => 'success'], 200);
        } catch (Exception $e) {
            Log::channel('monetapay')->error('Monetapay Disbursement Callback Error', [
                'error' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            $status = str_contains($e->getMessage(), 'AES Decryption failed')
                   || str_contains($e->getMessage(), 'Signature verification failed')
                ? 400
                : 500;

            return response()->json(['code' => (string) $status, 'msg' => $e->getMessage()], $status);
        }
    }
}
