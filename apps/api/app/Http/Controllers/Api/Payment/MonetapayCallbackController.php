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
        try {
            $validated = $request->validate([
                'data' => 'required|string',
            ]);

            // Step 1: Decrypt AES-128-CBC envelope
            $decrypted = $this->monetapayService->decryptPayload($validated['data']);

            // Step 2: Verify Double MD5 signature — reject anything that doesn't match
            if (!$this->monetapayService->verifyCallbackSignature($decrypted)) {
                Log::warning('Monetapay callback signature mismatch', ['payload' => $decrypted]);
                throw new Exception('Signature verification failed.');
            }

            // Step 3: Map to DTO and run business logic
            $dto = new MonetapayCallbackDTO(
                outNo:      $decrypted['out_trade_no'],
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

            // Monetapay expects 400 for decrypt/signature failures, 500 for internal errors
            $status = str_contains($e->getMessage(), 'AES Decryption failed')
                   || str_contains($e->getMessage(), 'Signature verification failed')
                ? 400
                : 500;

            return response()->json(['code' => (string) $status, 'msg' => $e->getMessage()], $status);
        }
    }
}
