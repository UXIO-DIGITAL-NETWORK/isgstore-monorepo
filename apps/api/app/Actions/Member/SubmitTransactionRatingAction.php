<?php

declare(strict_types=1);

namespace App\Actions\Member;

use App\Enums\TransactionStatus;
use App\Models\Rating;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Post-purchase review.
 *
 * Three guards, all necessary: the transaction must belong to the caller
 * (otherwise anyone could review anyone's order), it must be COMPLETED
 * (a review before delivery says nothing), and it can only be reviewed once
 * (otherwise a single purchase could be used to flood the average).
 */
class SubmitTransactionRatingAction
{
    public function execute(User $user, string $invoiceNumber, int $rating, ?string $comment): Rating
    {
        // Looked up by invoice number, not id: that is the only identifier the
        // storefront ever holds, and scoping the lookup to the caller means an
        // invoice belonging to someone else is indistinguishable from one that
        // does not exist.
        $transaction = Transaction::query()
            ->where('invoice_number', $invoiceNumber)
            ->where('user_id', $user->id)
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
            'user_id' => $user->id,
            'rating' => $rating,
            'comment' => $comment,
        ]);
    }
}
