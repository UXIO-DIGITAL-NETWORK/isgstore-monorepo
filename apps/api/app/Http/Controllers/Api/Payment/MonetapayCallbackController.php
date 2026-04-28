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

    public function __invoke(Request $request, HandleMonetapayCallbackAction $action)
    {
        try {
            // Validate incoming payload
            $validated = $request->validate([
                'reference_id' => 'required|string',
                'amount' => 'required|integer',
                'status' => 'required|string',
                'signature' => 'required|string',
            ]);

            // Map to DTO
            $dto = new MonetapayCallbackDTO(
                referenceId: $validated['reference_id'],
                amount: (int) $validated['amount'],
                status: $validated['status'],
                signature: $validated['signature'],
                rawPayload: $request->all()
            );

            // Execute Business Logic
            $action->execute($dto);

            return response()->json(['message' => 'Callback processed successfully'], 200);
            
        } catch (Exception $e) {
            Log::error('Monetapay Callback Error', [
                'error' => $e->getMessage(),
                'payload' => $request->all()
            ]);
            
            // Monetapay usually expects 400 for bad requests or validation errors, 
            // but 500 for internal errors. We return 400 if signature fails.
            $status = str_contains($e->getMessage(), 'Invalid Monetapay signature') ? 400 : 500;
            return response()->json(['message' => $e->getMessage()], $status);
        }
    }
}
