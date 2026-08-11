<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Capture Monetapay's actual fee per payment.
 *
 * `admin_fee` is what the customer was charged on top of the product price
 * (kita's markup). `gateway_fee` is what Monetapay actually deducted. The
 * platform's profit on a settlement is admin_fee - gateway_fee, so we need the
 * real gateway figure recorded rather than inferred.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->bigInteger('gateway_fee')->default(0)->after('admin_fee');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('gateway_fee');
        });
    }
};
