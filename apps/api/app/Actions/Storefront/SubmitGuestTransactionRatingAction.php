<?php

declare(strict_types=1);

namespace App\Actions\Storefront;

use App\Enums\TransactionStatus;
use App\Models\Rating;
use App\Models\Transaction;
use App\Support\Storefront\GuestName;
use Illuminate\Validation\ValidationException;

/**
 * Post-purchase review for a guest checkout.
 *
 * The guest half of App\Actions\Member\SubmitTransactionRatingAction: same three
 * guards, but scoped to guest transactions (`user_id` null) since that is the
 * only kind a caller with no account can own. Authorization is holding the
 * invoice number — the same basis as the public receipt endpoint — so a member's
 * invoice is indistinguishable from one that does not exist. The author name is
 * a generated pseudonym stored on the row (there is no user to read a name from).
 */
class SubmitGuestTransactionRatingAction
{
    public function execute(string $invoiceNumber, int $rating, ?string $comment): Rating
    {
        $transaction = Transaction::query()
            ->where('invoice_number', $invoiceNumber)
            ->whereNull('user_id')
            ->first();

        if (! $transaction) {
            throw ValidationException::withMessages([
                'transaction' => 'Transaksi tidak ditemukan.',
            ]);
        }

        if ($transaction->status !== TransactionStatus::COMPLETED) {
            throw ValidationException::withMessages([
                'transaction' => 'Hanya transaksi yang sudah selesai yang bisa dinilai.',
            ]);
        }

        if ($transaction->rating()->exists()) {
            throw ValidationException::withMessages([
                'transaction' => 'Transaksi ini sudah dinilai.',
            ]);
        }

        return Rating::create([
            'transaction_id' => $transaction->id,
            'user_id' => null,
            'guest_name' => GuestName::generate(),
            'rating' => $rating,
            'comment' => $comment,
        ]);
    }
}
