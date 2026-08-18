<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * Service bills are paid through Monetapay now, so there is no bukti transfer
 * to upload and nothing left that reads these columns.
 *
 * The stored files go with them. `down()` can restore the columns but not the
 * images — this is deliberately a one-way door, taken with the operator's
 * explicit decision to drop the archive rather than keep it read-only.
 */
return new class extends Migration
{
    public function up(): void
    {
        Storage::disk('public')->deleteDirectory('service-invoices/proofs');

        Schema::table('service_invoices', function (Blueprint $table) {
            $table->dropColumn(['proof_path', 'proof_uploaded_at']);
        });
    }

    public function down(): void
    {
        Schema::table('service_invoices', function (Blueprint $table) {
            $table->string('proof_path')->nullable()->after('due_at');
            $table->timestamp('proof_uploaded_at')->nullable()->after('proof_path');
        });
    }
};
