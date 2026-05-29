<?php

namespace App\Http\Controllers\Api\Payment;

use App\Actions\Payment\HandleMonetapayCallbackAction;
use App\DTOs\Payment\MonetapayCallbackDTO;
use App\Http\Controllers\Controller;
use App\Services\Payment\MonetapayService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MonetapayCallbackController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly MonetapayService $monetapayService,
        private readonly HandleMonetapayCallbackAction $action
    ) {}

    public function __invoke(Request $request)
    {
        // Gatekeeper: log raw payload before any validation so failures are always traceable
        Log::info('Monetapay Webhook Hit', $request->all());

        try {
            // Actual envelope: { "data": { "en_data": "...", "partner_key": "...", "mch_order_no": "..." } }
            $validated = $request->validate([
                'data'          => ['required', 'array'],
                'data.en_data'  => ['required', 'string'],  // AES-encrypted payload
                'data.partner_key'  => ['nullable', 'string'],
                'data.mch_order_no' => ['nullable', 'string'],
            ]);

            // Step 1: Decrypt only the en_data string — not the whole data object
            $decrypted = $this->monetapayService->decryptPayload($validated['data']['en_data']);

            // Step 2: Verify Double MD5 signature — reject forged/replayed callbacks
            if (!$this->monetapayService->verifyCallbackSignature($decrypted)) {
                Log::warning('Monetapay callback signature mismatch', [
                    'mch_order_no' => $validated['data']['mch_order_no'] ?? null,
                    'decrypted'    => $decrypted,
                ]);
                throw new Exception('Signature verification failed.');
            }

            // Step 3: Map to DTO and run business logic
            $dto = new MonetapayCallbackDTO(
                outNo:      $decrypted['mch_order_no'],
                amount:     (int) $decrypted['amount'],
                status:     $decrypted['status'],
                rawPayload: $decrypted
            );

            $this->action->execute($dto);

            return response()->json(['code' => '200', 'msg' => 'SUCCESS'], 200);

        } catch (Exception $e) {
            Log::error('Monetapay Callback Error', [
                'error'   => $e->getMessage(),
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
