<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Two operational settings that promised behaviour no code implemented.
 *
 * `order_auto_expire_minutes` claimed to govern when an unpaid order dies, but
 * expiry has always come from `PaymentExpiry`'s per-payment-method windows —
 * five different figures, off by hours — so the single number was never read.
 * `support_notification_email` claimed an ops mailbox, while ops alerts go to a
 * Discord webhook and the mail stack configures only a sender.
 *
 * Its replacement, `order_expiry_minutes`, carries those windows for real and
 * is created by `SettingSeeder`. This migration only clears what it supersedes,
 * because `SettingSeeder` never deletes rows: an environment that does not
 * re-run seeders would otherwise keep showing two fields that do nothing.
 */
return new class extends Migration
{
    /** Keys whose labels described behaviour nothing implemented. */
    private const DEAD_KEYS = ['order_auto_expire_minutes', 'support_notification_email'];

    public function up(): void
    {
        DB::table('settings')->whereIn('key', self::DEAD_KEYS)->delete();
    }

    public function down(): void
    {
        // Deliberately not restored. Rolling back would re-create two
        // admin-editable fields that nothing reads — the exact state this
        // migration exists to end.
    }
};
