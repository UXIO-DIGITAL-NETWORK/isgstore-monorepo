<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scopes an activity log entry to the transaction it describes.
 *
 * The admin's per-transaction Activity Log modal had no way to ask for one
 * order's audit trail — `activity_logs` was a single global feed. Searching it
 * by invoice number is unreliable (the message text is free-form) and would
 * quietly return nothing.
 *
 * Nullable because most entries are account-level (login, profile changes) and
 * belong to no transaction. `nullOnDelete` keeps the audit trail intact when a
 * transaction row is removed — losing the history of a deleted order is worse
 * than an orphaned entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->foreignId('transaction_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropForeign(['transaction_id']);
            $table->dropColumn('transaction_id');
        });
    }
};
