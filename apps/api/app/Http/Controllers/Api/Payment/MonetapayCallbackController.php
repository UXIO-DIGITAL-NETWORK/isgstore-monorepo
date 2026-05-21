<?php

namespace App\Http\Controllers\Api\Payment;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;
use App\Actions\Payment\HandleMonetapayCallbackAction;
use App\DTOs\Payment\MonetapayCallbackDTO;
use Exception;
use Illuminate\Support\Facades\Log;

class MonetapayCallbackController extends Controller
{
    use ApiResponse;

    public function __invoke(Request $request, HandleMonetapayCallbackAction $action, \App\Services\Payment\MonetapayService $monetapayService)
    {
        try {
            // Validate incoming payload
            $validated = $request->validate([
                'data' => 'required|string',
            ]);

            // Decrypt payload
            $decrypted = $monetapayService->decryptPayload($validated['data']);

            // Map to DTO
            $dto = new MonetapayCallbackDTO(
                outNo: $decrypted['out_trade_no'],
                amount: (int) $decrypted['amount'],
                status: $decrypted['status'],
                rawPayload: $decrypted
            );

            // Execute Business Logic
            $action->execute($dto);

            return response()->json(['code' => '200', 'msg' => 'SUCCESS'], 200);
            
        } catch (Exception $e) {
            Log::error('Monetapay Callback Error', [
                'error' => $e->getMessage(),
                'payload' => $request->all()
            ]);
            
            // Monetapay requires 400 on decryption/validation failure.
            $status = str_contains($e->getMessage(), 'AES Decryption failed') ? 400 : 500;
            return response()->json(['code' => (string)$status, 'msg' => $e->getMessage()], $status);
        }
    }
}
