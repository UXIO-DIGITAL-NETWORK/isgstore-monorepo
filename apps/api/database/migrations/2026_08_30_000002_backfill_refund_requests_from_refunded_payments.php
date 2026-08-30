<?php

use App\Models\Payment;
use App\Models\RefundRequest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Rows already refunded by the retired automatic flow (`payments.status = '4'`)
 * predate `refund_requests` and would be invisible on the new refund page.
 *
 * Backfilled as COMPLETED with `method = legacy_gateway`, so the page can be
 * described honestly as "every refund" rather than "every refund since the
 * rewrite" — the distinction matters the first time someone asks about a
 * refund from last month.
 *
 * No money moves and no settlement is reversed: these refunds already
 * happened, and re-reversing their bookkeeping now would double-count.
 */
return new class extends Migration
{
    public function up(): void
    {
        Payment::query()
            ->where('status', '4')
            ->whereDoesntHave('transaction.refundRequest')
            ->with('transaction')
            ->chunkById(200, function ($payments) {
                $rows = [];

                foreach ($payments as $payment) {
                    $transaction = $payment->transaction;

                    if (! $transaction) {
                        continue;
                    }

                    $rows[] = [
                        'transaction_id' => $transaction->id,
                        'payment_id' => $payment->id,
                        'user_id' => $transaction->user_id,
                        'merchant_id' => $transaction->merchant_id,
                        'refund_number' => 'RFD-'.Str::lower(Str::random(12)),
                        'method' => 'legacy_gateway',
                        'status' => 'COMPLETED',
                        'amount' => (int) $payment->gross_amount,
                        'contact_email' => $transaction->contact_email,
                        'contact_phone' => $transaction->guest_contact,
                        // The old flow left no timestamp of its own; the payment
                        // row's last write is the closest honest approximation.
                        'refunded_at' => $payment->updated_at,
                        // Deliberately null: their settlement was never reversed
                        // and must not be reversed retroactively.
                        'settlement_reversed_at' => null,
                        'created_at' => $payment->updated_at ?? now(),
                        'updated_at' => now(),
                    ];
                }

                if ($rows !== []) {
                    RefundRequest::insert($rows);
                }
            });
    }

    public function down(): void
    {
        DB::table('refund_requests')->where('method', 'legacy_gateway')->delete();
    }
};
