<?php

namespace App\Actions\Payment;

use App\DTOs\Payment\MonetapayCallbackDTO;
use App\Services\Payment\MonetapayService;
use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\Models\Payment;
use App\Jobs\ProcessDigiflazzTopup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class HandleMonetapayCallbackAction
{
    public function __construct(
        private MonetapayService $monetapayService,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(MonetapayCallbackDTO $dto): void
    {
        DB::transaction(function () use ($dto) {
            // 1. Ambil data Payment beserta Transaction untuk Digiflazz
            $payment = Payment::with('transaction')->where('reference_id', $dto->outNo)->lockForUpdate()->firstOrFail();
            $transaction = $payment->transaction;
            $status = strtoupper($dto->status);

            // Step B (Idempotency): If already PAID, PROCESSING, or COMPLETED, return early
            if (in_array($transaction->status, ['PAID', 'PROCESSING', 'COMPLETED'])) {
                return; // Return immediately to return HTTP 200
            }

            // Step C (Anti-fraud): Verify exact amount
            if ($payment->gross_amount != $dto->amount) {
                $this->logActivity($dto->outNo, 'Fraud detected: Amount mismatch', $dto->rawPayload);
                throw new Exception("Amount mismatch for reference {$dto->outNo}. Expected {$payment->gross_amount}, got {$dto->amount}");
            }

            // Step D: Update status
            $paymentStatus = $status === 'SUCCESS' ? '3' : '2';
            $payment->update([
                'status' => $paymentStatus,
                'paid_at' => $status === 'SUCCESS' ? now() : null,
            ]);

            if ($status === 'SUCCESS') {
                // Step D: Use DB::transaction(): Update status to PAID.
                $transaction->update(['status' => 'PAID']);

                // Step E: Trigger Digiflazz top-up automatically via Laravel Queue
                ProcessDigiflazzTopup::dispatch($transaction);
            } else {
                $transaction->update(['status' => 'FAILED_PROVIDER']);
            }

            // 4. Log successful callback processing
            $this->logActivity($dto->outNo, "Monetapay callback processed: {$status}", $dto->rawPayload);
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
