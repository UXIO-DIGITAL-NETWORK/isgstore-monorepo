<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Guest feedback.
 *
 * Guests check out without an account (`transactions.user_id` is null), so their
 * post-purchase review has no user to attach to. Allow a rating with a null
 * `user_id` and store a generated display pseudonym in `guest_name` instead
 * (see App\Support\Storefront\GuestName). Member ratings keep `user_id`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('ratings', function (Blueprint $table) {
            $table->dropColumn('guest_name');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
