<?php

namespace App\Http\Controllers\Api\Payment\Monetapay;

use App\Actions\Payment\Monetapay\HandleMonetapayCallbackAction;
use App\Contracts\PaymentGateway;
use App\DTOs\Payment\Monetapay\MonetapayCallbackDTO;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MonetapayCallbackController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PaymentGateway $monetapayService,
        private readonly HandleMonetapayCallbackAction $action
    ) {}

    public function __invoke(Request $request)
    {
        // Gatekeeper: record the hit before any validation so a failed callback
        // is always traceable. Only the reference — the envelope also carries the
        // partner key, and knowing we were called does not need the body.
        Log::channel('monetapay')->info('Monetapay Webhook Hit', [
            'mch_order_no' => $request->input('data.mch_order_no'),
        ]);

        try {
            // Actual envelope: { "data": { "en_data": "...", "partner_key": "...", "mch_order_no": "..." } }
            $validated = $request->validate([
                'data' => ['required', 'array'],
                'data.en_data' => ['required', 'string'],  // AES-encrypted payload
                'data.partner_key' => ['nullable', 'string'],
                'data.mch_order_no' => ['nullable', 'string'],
            ]);

            // Step 1: Decrypt only the en_data string — not the whole data object
            $decrypted = $this->monetapayService->decryptPayload($validated['data']['en_data']);

            // Step 2: Verify Double MD5 signature — reject forged/replayed callbacks
            if (! $this->monetapayService->verifyCallbackSignature($decrypted)) {
                // The keys, not the body: this payload failed verification, so it
                // is unvetted input, and it also names the payer.
                Log::channel('monetapay')->warning('Monetapay callback signature mismatch', [
                    'mch_order_no' => $validated['data']['mch_order_no'] ?? null,
                    'payload_keys' => is_array($decrypted) ? array_keys($decrypted) : [],
                ]);
                throw new Exception('Signature verification failed.');
            }

            // Step 3: Flag a callback booked to a different merchant. It is logged,
            // not rejected: the order is still matched by our own mch_order_no, and
            // refusing on a field we have never seen in a live payload would drop
            // real payments. A hit here means the sub-merchant config is wrong.
            if ($this->monetapayService->callbackTargetsAnotherMerchant($decrypted)) {
                Log::channel('monetapay')->warning('Monetapay callback names a different sub-merchant', [
                    'mch_order_no' => $decrypted['mch_order_no'] ?? null,
                    'callback_sub_mch_id' => $decrypted['sub_mch_id'] ?? null,
                    'configured_sub_mch_id' => $this->monetapayService->subMchId(),
                ]);
            }

            // Step 4: Map to DTO and run business logic
            $dto = new MonetapayCallbackDTO(
                outNo: $decrypted['mch_order_no'],
                amount: (int) $decrypted['amount'],
                status: $decrypted['status'],
                rawPayload: $decrypted
            );

            // The fields we act on, not the whole body. The decrypted payload
            // carries the payer's name and VA, and this channel is a file on disk
            // that operators keep for weeks.
            Log::channel('monetapay')->info('Monetapay Decrypted Payload', [
                'mch_order_no' => $decrypted['mch_order_no'] ?? null,
                'status' => $decrypted['status'] ?? null,
                'amount' => $decrypted['amount'] ?? null,
            ]);

            $this->action->execute($dto);

            return response()->json(['code' => 0, 'message' => 'success'], 200);

        } catch (Exception $e) {
            Log::channel('monetapay')->error('Monetapay Callback Error', [
                'error' => $e->getMessage(),
                'mch_order_no' => $request->input('data.mch_order_no'),
            ]);

            $status = str_contains($e->getMessage(), 'AES Decryption failed')
                   || str_contains($e->getMessage(), 'Signature verification failed')
                ? 400
                : 500;

            return response()->json(['code' => (string) $status, 'msg' => $e->getMessage()], $status);
        }
    }
}
