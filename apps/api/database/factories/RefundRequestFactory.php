<?php

namespace Database\Factories;

use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\Refund\RefundClaimToken;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<RefundRequest>
 */
class RefundRequestFactory extends Factory
{
    /** The plaintext of the last generated claim token, for tests to use. */
    public static ?string $lastClaimToken = null;

    public function definition(): array
    {
        [$plain, $hash] = RefundClaimToken::generate();
        self::$lastClaimToken = $plain;

        return [
            'transaction_id' => Transaction::factory(),
            'payment_id' => Payment::factory(),
            'user_id' => null,
            'merchant_id' => null,
            'refund_number' => 'RFD-'.Str::lower(Str::random(12)),
            'method' => RefundMethod::MANUAL_TRANSFER,
            'status' => RefundStatus::WAITING_DETAILS,
            'amount' => 12000,
            'contact_email' => 'guest@example.com',
            'contact_phone' => '6281234567890',
            'claim_token_hash' => $hash,
            'claim_expires_at' => now()->addDays(RefundClaimToken::TTL_DAYS),
        ];
    }

    /** Payout details supplied, waiting for an admin to transfer. */
    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => RefundStatus::PENDING,
            'bank_code' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Guest Customer',
            'payout_submitted_at' => now(),
            'payout_submitted_by' => 'customer',
        ]);
    }

    /** A member's refund: already credited to their balance. */
    public function balance(): static
    {
        return $this->state(fn () => [
            'method' => RefundMethod::BALANCE,
            'status' => RefundStatus::COMPLETED,
            'claim_token_hash' => null,
            'claim_expires_at' => null,
            'refunded_at' => now(),
        ]);
    }
}
