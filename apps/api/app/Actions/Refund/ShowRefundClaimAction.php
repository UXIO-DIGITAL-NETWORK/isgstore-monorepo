<?php

declare(strict_types=1);

namespace App\Actions\Refund;

use App\Enums\RefundMethod;
use App\Enums\RefundStatus;
use App\Support\Payout\BankCatalog;
use App\Support\Refund\RefundClaimToken;

/**
 * The public claim page behind a one-time link.
 *
 * The projection is built field-by-field on purpose, exactly like
 * `ShowInvoiceAction`. Whoever holds the link is unauthenticated, so this must
 * never carry `user_id`, `claimed_user_id`, `merchant_id`, `payment_id`, the raw
 * contact details, or anything about the sale's economics. The customer's own
 * email and phone come back masked — enough to confirm we are talking about
 * their order, useless to someone who intercepted the link.
 *
 * `can_claim_account` and `can_submit_payout` are decided here rather than
 * re-derived by the client from the status string: the two schemes overlap in
 * PENDING, and a client guessing would offer a bank-account form on a refund
 * that pays to balance.
 */
class ShowRefundClaimAction
{
    /** @return array<string, mixed>|null */
    public function execute(string $claimToken): ?array
    {
        $refund = RefundClaimToken::resolve($claimToken);

        if (! $refund) {
            return null;
        }

        $refund->loadMissing(['transaction.product']);

        return [
            'refund_number' => $refund->refund_number,
            'invoice_number' => $refund->transaction?->invoice_number,
            'product' => $refund->transaction?->product?->name,
            'amount' => (int) $refund->amount,
            'status' => $refund->status->value,
            'method' => $refund->method->value,
            'can_submit_payout' => $refund->isPayoutEditable(),
            // The current scheme: the money is waiting for an account.
            'can_claim_account' => $refund->method === RefundMethod::BALANCE_CLAIM
                && $refund->status === RefundStatus::WAITING_ACCOUNT,
            // Set once claimed — what we promised, so the page can say it.
            'verify_due_at' => $refund->verify_due_at?->toIso8601String(),
            'contact' => [
                'email' => $this->maskEmail($refund->contact_email),
                'phone' => $this->maskPhone($refund->contact_phone),
            ],
            'payout' => $refund->hasPayoutDetails() ? [
                'bank_code' => $refund->bank_code,
                'bank_name' => BankCatalog::name((string) $refund->bank_code),
                'account_number' => $this->maskAccount($refund->account_number),
                'account_name' => $refund->account_name,
                'submitted_at' => $refund->payout_submitted_at?->toIso8601String(),
            ] : null,
            'refunded_at' => $refund->refunded_at?->toIso8601String(),
            'created_at' => $refund->created_at?->toIso8601String(),
        ];
    }

    private function maskEmail(?string $email): ?string
    {
        if (! $email || ! str_contains($email, '@')) {
            return null;
        }

        [$name, $domain] = explode('@', $email, 2);
        $head = mb_substr($name, 0, 2);

        return $head.str_repeat('•', max(2, mb_strlen($name) - 2)).'@'.$domain;
    }

    private function maskPhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        return '••••'.mb_substr($phone, -4);
    }

    private function maskAccount(?string $number): ?string
    {
        if (! $number) {
            return null;
        }

        return '••••'.mb_substr($number, -4);
    }
}
