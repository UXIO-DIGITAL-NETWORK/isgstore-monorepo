<?php

namespace Database\Factories;

use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Transaction;
use App\Support\Refund\RefundClaimToken;
use App\Support\Refund\RefundSla;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<RefundRequest>
 *
 * The default is deliberately still the retired `manual_transfer` shape: the
 * existing suite exercises the rows that must keep draining through the admin
 * queue, and silently re-pointing it at the new scheme would stop testing that.
 * New-scheme tests opt in with `balanceClaim()` / `claimedBy()`.
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

    /** The current guest shape: owed, waiting for the customer to make an account. */
    public function balanceClaim(): static
    {
        return $this->state(fn () => [
            'method' => RefundMethod::BALANCE_CLAIM,
            'status' => RefundStatus::WAITING_ACCOUNT,
        ]);
    }

    /**
     * Claimed with an account and waiting on an admin. Mirrors what
     * `ClaimRefundWithAccountAction` leaves behind, token included — the link
     * is dead once it has been used.
     */
    public function claimedBy(int $userId, string $match = 'email', ?string $value = null): static
    {
        return $this->state(fn () => [
            'method' => RefundMethod::BALANCE_CLAIM,
            'status' => RefundStatus::PENDING,
            'user_id' => $userId,
            'claimed_user_id' => $userId,
            'claimed_at' => now(),
            'claimed_contact_match' => $match,
            'claimed_contact_value' => $value ?? 'guest@example.com',
            'verify_due_at' => RefundSla::dueAt(),
            'claim_token_hash' => null,
            'claim_expires_at' => null,
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
