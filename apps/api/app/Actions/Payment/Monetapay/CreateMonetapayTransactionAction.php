<?php

namespace App\Actions\Payment\Monetapay;

use App\Actions\Log\CreateActivityLogAction;
use App\DTOs\Log\CreateActivityLogDTO;
use App\DTOs\Payment\Monetapay\MonetapayTransactionDTO;
use App\Services\Payment\MonetapayService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CreateMonetapayTransactionAction
{
    public function __construct(
        private MonetapayService $monetapayService,
        private CreateActivityLogAction $activityLogAction
    ) {}

    public function execute(MonetapayTransactionDTO $dto): array
    {
        // 1. Hit Monetapay Service
        $response = $this->monetapayService->createTransaction(
            referenceId: $dto->referenceId,
            amount: $dto->amount,
            channel: $dto->channel,
            customerData: $dto->customerData
        );

        // 2. Save Transaction locally (Using DB facade as basic implementation)
        // Assuming a `transactions` table exists.
        DB::table('transactions')->insert([
            'reference_id' => $dto->referenceId,
            'amount' => $dto->amount,
            'payment_method_code' => $dto->channel, // From the payment_methods table
            'status' => 'PENDING',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Log Activity
        $this->activityLogAction->execute(new CreateActivityLogDTO(
            userId: Auth::id(),
            ipAddress: request()->ip(),
            userAgent: request()->userAgent(),
            message: "Created Monetapay transaction: {$dto->referenceId}"
        ));

        return $response;
    }
}
