<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Models\Notification;

/**
 * Writes an in-app notification for one named recipient.
 *
 * The third sibling of `NotifyRoleAction` and `NotifyPaymentInternalAction`,
 * and the one a per-client alert needs: a merchant's subscription belongs to
 * that merchant, not to a role, and fanning it to everyone holding
 * `payment-admin` would tell every client about every other client's billing.
 *
 * No recipient cache, unlike its siblings — there is nothing to cache when the
 * caller already holds the id.
 */
class NotifyUserAction
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(int $userId, string $type, string $title, string $message, array $data = [], ?string $dedupeKey = null): void
    {
        $values = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data ?: null,
        ];

        if ($dedupeKey === null) {
            Notification::create(['user_id' => $userId] + $values);

            return;
        }

        // One per (recipient, key) via the unique index — a re-run no-ops.
        Notification::firstOrCreate(
            ['user_id' => $userId, 'dedupe_key' => $dedupeKey],
            $values,
        );
    }
}
