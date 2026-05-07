<?php

namespace App\Actions\Payment;

use App\DTOs\Payment\MonetapayCallbackDTO;
use App\Services\Payment\MonetapayService;
use App\Actions\Log\CreateActivityLogAction;
use App\Actions\Digiflazz\ProcessDigiflazzTransactionAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use Exception;

class HandleMonetapayCallbackAction
{
    public function __construct(
        private MonetapayService $monetapayService,
        private CreateActivityLogAction $activityLogAction,
        private ProcessDigiflazzTransactionAction $digiflazzAction
    ) {}

    public function execute(MonetapayCallbackDTO $dto): void
    {
        // 1. Verify Signature
        $expectedSignature = $this->monetapayService->generateSignature($dto->referenceId, $dto->amount);

        if (!hash_equals($expectedSignature, $dto->signature)) {
            $this->logActivity($dto->referenceId, 'Signature Verification Failed', $dto->rawPayload);
            throw new Exception("Invalid Monetapay signature for reference {$dto->referenceId}");
        }

        DB::transaction(function () use ($dto) {
            // 2. Ambil data Payment beserta Order untuk Digiflazz
            $payment = Payment::with('order')->where('reference_id', $dto->referenceId)->lockForUpdate()->firstOrFail();
            $status = strtoupper($dto->status);

            // Update status payment (3 = Success, 2 = Failed/Canceled)
            $paymentStatus = $status === 'SUCCESS' ? '3' : '2';
            $payment->update([
                'status' => $paymentStatus,
                'paid_at' => $status === 'SUCCESS' ? now() : null,
            ]);

            // 3. Handle Business Logic & Eksekusi Digiflazz
            if ($status === 'SUCCESS' && $payment->order->status === 'Pending') {
                $payment->order->update(['status' => 'Processing']);

                // Melepaskan tembakan API ke Digiflazz karena uang sudah diterima
                $this->digiflazzAction->execute($payment->order);
            }

            // 4. Log successful callback processing
            $this->logActivity($dto->referenceId, "Monetapay callback processed: {$status}", $dto->rawPayload);
        });
    }

    private function logActivity(string $referenceId, string $message, array $payload): void
    {
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: null,
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "{$message} | Ref: {$referenceId}"
        ));
    }
}
