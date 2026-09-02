<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A duration-based membership renews itself from the member's wallet.
 *
 * `auto_renew` lives on **users**, not on the subscription row. A member who
 * turns it off means "stop billing me", not "stop billing me for this one
 * period" — and putting it on the subscription would mean copying the setting
 * forward on every renewal, where one missed copy silently switches billing
 * back on.
 *
 * `renewed_into_id` is the idempotency key. A row lock alone does not protect
 * two workers on separate connections, and this debits a wallet: the unique
 * index is what makes a double run a duplicate-key error instead of a double
 * charge. It also gives `memberships:expire` its existing `$stillCovered`
 * answer for free — renewal writes a *successor* row starting where the old one
 * ends, so the two commands need no ordering guarantee between them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // On by default: the member opted into a recurring plan by buying
            // one. The switch to turn it off lives in the member area.
            $table->boolean('auto_renew')->default(true)->after('membership_plan_id');
        });

        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->foreignId('renewed_into_id')->nullable()->after('price_paid')
                ->constrained('membership_subscriptions')->nullOnDelete();
            $table->unique('renewed_into_id');
        });
    }

    public function down(): void
    {
        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->dropUnique(['renewed_into_id']);
            $table->dropForeign(['renewed_into_id']);
            $table->dropColumn('renewed_into_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('auto_renew');
        });
    }
};
