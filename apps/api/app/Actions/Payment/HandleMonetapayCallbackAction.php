<?php

namespace App\Actions\Payment;

use App\DTOs\Payment\MonetapayCallbackDTO;
use App\Services\Payment\MonetapayService;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use Illuminate\Support\Facades\DB;
use Exception;

class HandleMonetapayCallbackAction
{
    public function __construct(
        private MonetapayService $monetapayService,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(MonetapayCallbackDTO $dto): void
    {
        // 1. Verify Signature
        $expectedSignature = $this->monetapayService->generateSignature($dto->referenceId, $dto->amount);
        
        if (!hash_equals($expectedSignature, $dto->signature)) {
            $this->logActivity($dto->referenceId, 'Signature Verification Failed', $dto->rawPayload);
            throw new Exception("Invalid Monetapay signature for reference {$dto->referenceId}");
        }

        // 2. Update local transaction status
        $status = strtoupper($dto->status);
        DB::table('transactions')
            ->where('reference_id', $dto->referenceId)
            ->update([
                'status' => $status,
                'updated_at' => now(),
            ]);

        // 3. Handle Business Logic
        if ($status === 'SUCCESS') {
            // e.g., Top-up user balance, mark order as paid, etc.
            // ...
        }

        // 4. Log successful callback processing
        $this->logActivity($dto->referenceId, "Monetapay callback processed: {$status}", $dto->rawPayload);
    }

    private function logActivity(string $referenceId, string $message, array $payload): void
    {
        // For callbacks, we might not have an Auth user.
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: null, 
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "{$message} | Ref: {$referenceId}"
        ));
    }
}
