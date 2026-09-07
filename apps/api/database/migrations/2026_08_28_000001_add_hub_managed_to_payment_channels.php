<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marks the channels the Hub actually owns.
 *
 * HUB_MANAGED_CHANNELS used to lock the payment-internal fee editor for EVERY
 * channel, but the Hub's master holds only the Monetapay-contracted codes — it
 * has never known about `balance` (the internal wallet) or `payment_link`.
 * The result was that those two could not be edited anywhere at all. The sync
 * sets this flag on every row it writes, so the editor refuses exactly the
 * rows a sync would overwrite and leaves the site's own channels alone.
 *
 * Defaults false: a standalone deployment, and any channel the Hub has not
 * claimed, stays fully local.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->boolean('hub_managed')->default(false)->after('is_single_use');
        });
    }

    public function down(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn('hub_managed');
        });
    }
};
