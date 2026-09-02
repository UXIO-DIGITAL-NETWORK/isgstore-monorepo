<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The guest refund path stops being a bank transfer and becomes a claim:
 * the customer creates (or signs in to) an account, and an admin verifies that
 * account before the balance is credited.
 *
 * These columns are the evidence of that verification. They exist because the
 * question an admin has to answer two days later — "is this really the person
 * who paid?" — cannot be answered from mutable data: a user can change their
 * email in their profile after claiming. So the matched contact is frozen at
 * claim time, exactly like `amount` and `merchant_id` already are on this table.
 *
 * The payout columns are untouched. `manual_transfer` rows opened under the
 * retired scheme are still worked to completion through the same queue.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('refund_requests', function (Blueprint $table) {
            // restrictOnDelete, not nullOnDelete like `user_id`. A claimed
            // refund whose claimant silently vanished is unauditable: the row
            // would still read balance_claim/PENDING with nobody attached, and
            // no one could say who had been verified. `transactions.user_id`
            // makes the same choice for the same reason.
            $table->foreignId('claimed_user_id')->nullable()->after('user_id')
                ->constrained('users')->restrictOnDelete();
            $table->timestamp('claimed_at')->nullable()->after('claim_notified_at');
            // Which contact matched, and what it said at the time. Both are
            // shown to the verifying admin; neither is ever re-derived.
            $table->string('claimed_contact_match', 16)->nullable()->after('claimed_at')
                ->comment('email | phone — which order contact the account matched');
            $table->string('claimed_contact_value')->nullable()->after('claimed_contact_match')
                ->comment('Frozen at claim time; the account may change it later');
            // 2x24 working hours from the claim, not from the refund opening:
            // the clock is ours only once the customer has done their part.
            $table->timestamp('verify_due_at')->nullable()->after('claimed_contact_value');
            // A second, third rejected claim on the same refund is the signal
            // that someone is fishing with a leaked invoice number.
            $table->unsignedSmallInteger('claim_rejected_count')->default(0)->after('verify_due_at');

            // The overdue sweep and the SLA column both read this pair.
            $table->index(['status', 'verify_due_at']);
            $table->index('claimed_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('refund_requests', function (Blueprint $table) {
            $table->dropIndex(['status', 'verify_due_at']);
            // Foreign key before its index: InnoDB refuses to drop an index a
            // constraint still needs (errno 1553), and claimed_user_id's index
            // is the only one backing it.
            $table->dropForeign(['claimed_user_id']);
            $table->dropIndex(['claimed_user_id']);
            $table->dropColumn([
                'claimed_user_id',
                'claimed_at',
                'claimed_contact_match',
                'claimed_contact_value',
                'verify_due_at',
                'claim_rejected_count',
            ]);
        });
    }
};
