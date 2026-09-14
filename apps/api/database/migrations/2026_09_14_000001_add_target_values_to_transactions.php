<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The complete set of identifiers the customer supplied, keyed by the
     * category's own field keys.
     *
     * A game may ask for more than an account id and a server, and two columns
     * cannot hold that. `target_uid`/`target_server` stay as they are — the
     * invoice, the receipt email, the WhatsApp message and the member list all
     * read them by name — and now carry the first two identifiers of the map.
     * Rows written before this column exists have no map and are still composed
     * from the two columns.
     */
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->json('target_values')->nullable()->after('target_server');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('target_values');
        });
    }
};
