<?php

use App\Models\PaymentChannel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Per-channel payment-gateway fee. Kita's profit is the admin fee net of this
 * cut, so it needs to be a known percentage of each transaction rather than the
 * unreliable value the Monetapay callback sometimes carries.
 *
 * Defaults to 0.70% for every real channel; the wallet ("balance") channel has
 * no external gateway, so it stays 0. Existing payments are backfilled to the
 * same 0.7%-of-gross figure checkout now freezes, so historical Fee Gateway /
 * Profit Kita line up. Run before `payment:settle-backfill` so settlement books
 * profit against the corrected fee.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->decimal('gateway_fee_percent', 5, 2)->default(0.70)->after('fee_percent');
        });

        // The wallet channel is settled internally — no gateway takes a cut.
        DB::table('payment_channels')->where('channel_code', 'balance')->update(['gateway_fee_percent' => 0]);

        // Freeze the same computed fee onto existing payments, per their channel.
        foreach (PaymentChannel::all() as $channel) {
            $percent = (float) $channel->gateway_fee_percent;

            DB::table('payments')
                ->where('payment_channel_id', $channel->id)
                ->update([
                    'gateway_fee' => DB::raw('ROUND(gross_amount * '.($percent / 100).')'),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('payment_channels', function (Blueprint $table) {
            $table->dropColumn('gateway_fee_percent');
        });
    }
};
