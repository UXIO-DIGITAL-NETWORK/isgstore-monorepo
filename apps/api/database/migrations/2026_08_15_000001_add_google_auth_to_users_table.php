<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * "Sign in with Google" support.
     *
     * A Google-only account has neither a password (the identity lives with
     * Google) nor a phone (Google does not return one), so both columns become
     * nullable. `google_id` stores the Google subject id and is unique so a
     * Google identity maps to exactly one user; NULL is allowed for the many
     * existing password accounts (MySQL permits multiple NULLs under a unique
     * index, and SQLite — used by the test suite — does the same).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->string('password')->nullable()->change();
            $table->string('phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['google_id']);
            $table->dropColumn('google_id');
            // Note: password/phone are left nullable on rollback — restoring
            // NOT NULL would fail against any Google-only rows created since.
        });
    }
};
