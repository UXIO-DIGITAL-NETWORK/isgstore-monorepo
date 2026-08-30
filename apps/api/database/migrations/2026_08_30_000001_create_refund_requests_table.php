<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * One row per refunded transaction — the ledger of "money we owe back".
 *
 * A member's refund lands here already COMPLETED (the balance was credited in
 * the same transaction that wrote this row); a guest's lands as
 * WAITING_DETAILS and is worked by hand from the admin refund page.
 *
 * The payout columns deliberately reuse the `withdrawals` vocabulary
 * (bank_code / account_number / account_name / account_phone, validated
 * against `App\Support\Payout\BankCatalog`) so the two places money leaves the
 * platform speak one language instead of two.
 *
 * `status` is a plain string with an enum cast, not a native DB enum:
 * `transactions.status` is the only native enum left and `UnifiedTransactionQuery`
 * already has to CAST around it. `withdrawals.status` is the modern precedent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refund_requests', function (Blueprint $table) {
            $table->id();

            // Unique: one refund per transaction. This is the idempotency key —
            // a retried webhook racing the queue's failed() hook cannot create
            // a second refund even if both pass the payment-status guard.
            $table->foreignId('transaction_id')->unique()->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            // Null = guest checkout; that is what selects the manual path.
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Frozen copy: UpdateTransactionAction can edit the source row, and
            // the settlement reversal must un-book whoever was actually credited.
            $table->foreignId('merchant_id')->nullable()->constrained('users')->nullOnDelete();

            // The non-secret handle the customer and admin both quote.
            $table->string('refund_number')->unique();
            $table->string('method')->index()->comment('balance | manual_transfer | legacy_gateway');
            $table->string('status')->default('WAITING_DETAILS');
            $table->bigInteger('amount')->comment('Frozen payments.gross_amount — never recomputed');

            // Snapshot of the contact captured at checkout. Copied rather than
            // joined so the refund page keeps identifying the customer even if
            // the transaction row is later edited by an admin.
            $table->string('contact_email')->nullable()->index();
            $table->string('contact_phone', 32)->nullable()->index();

            // The claim link is a bearer credential. Only its sha256 is stored:
            // the plaintext exists in the customer's email/WhatsApp and nowhere
            // else, so a database read cannot redirect anyone's money.
            $table->char('claim_token_hash', 64)->nullable()->unique();
            $table->timestamp('claim_expires_at')->nullable();
            $table->timestamp('claim_notified_at')->nullable();

            // Payout destination — same vocabulary as `withdrawals`.
            $table->string('bank_code')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_name')->nullable();
            $table->string('account_phone', 32)->nullable();
            $table->timestamp('payout_submitted_at')->nullable();
            // "The customer confirmed this account" and "an admin typed it from
            // a phone call" are different defences if a transfer is disputed.
            $table->string('payout_submitted_by')->nullable()->comment('customer | admin');

            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            // Transfer receipt — public disk path, stored byte-for-byte like
            // every other payment proof (never through ImageOptimizer).
            $table->string('proof_path')->nullable();
            $table->string('admin_note')->nullable();
            $table->string('reject_reason')->nullable();
            $table->timestamp('refunded_at')->nullable()->comment('When the money actually left');
            $table->timestamp('settlement_reversed_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index(['method', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_requests');
    }
};
