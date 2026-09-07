<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Split the supplier's half of the lifecycle out of `transactions.status`.
 *
 * `status` answers two questions at once — did the customer pay, and did the
 * supplier deliver — which is why an operator staring at PROCESSING cannot tell
 * whether uxiolabs has the order or the queue worker simply has not sent it yet.
 * This column answers only the second, so both can be read and filtered apart.
 *
 * `string`, not a native DB enum. `transactions.status` is the last native enum
 * in the schema and it is exactly why `UnifiedTransactionQuery::salesLeg()` has to
 * `CAST(t.status AS CHAR)` before the union — no reason to repeat that. Adding a
 * case to a native enum also means an ALTER on a hot table; `withdrawals.status`
 * and `refund_requests.status` are the modern precedent here.
 *
 * NOT NULL with a default rather than nullable: every transaction has a provider
 * lifecycle even when the answer is "no order was ever placed". NULL would smuggle
 * in a third meaning ("unknown"), which is the ambiguity this whole change removes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('provider_status', 32)
                ->default('NOT_ORDERED')
                ->after('supplier_status')
                ->comment('App\Enums\ProviderStatus — did the supplier deliver');

            $table->index('provider_status');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropIndex(['provider_status']);
            $table->dropColumn('provider_status');
        });
    }
};
