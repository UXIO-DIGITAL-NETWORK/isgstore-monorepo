<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Machine-readable classification for the member Activity Log page, which
 * filters by kind. Indexed because that filter is the page's default query.
 *
 * Nullable so historical rows — which only ever carried a free-text `message`
 * — keep working; they simply fall into the "all" bucket.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->string('type', 32)->nullable()->index()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn('type');
        });
    }
};
