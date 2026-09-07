<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Enums\RoleType;
use App\Models\Notification;
use App\Models\User;

/**
 * Fans an in-app notification out to every user holding a given role, so each
 * has their own read state. Pass a `dedupeKey` for alerts that must fire only
 * once per recipient — a re-run then no-ops via the (user_id, dedupe_key)
 * unique index.
 *
 * A sibling of `NotifyPaymentInternalAction` rather than a generalisation of
 * it: that one caches its recipients for the lifetime of the instance and is
 * resolved as a singleton-ish dependency in several payment flows, so turning
 * its cache into a per-role map would change behaviour at call sites that have
 * nothing to do with this feature. One extra query per fan-out is cheaper than
 * that risk.
 */
class NotifyRoleAction
{
    /** @var array<string, array<int, int>> */
    private array $recipientIds = [];

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(RoleType $role, string $type, string $title, string $message, array $data = [], ?string $dedupeKey = null): void
    {
        $values = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data ?: null,
        ];

        foreach ($this->recipientIds($role) as $userId) {
            if ($dedupeKey === null) {
                Notification::create(['user_id' => $userId] + $values);

                continue;
            }

            Notification::firstOrCreate(
                ['user_id' => $userId, 'dedupe_key' => $dedupeKey],
                $values,
            );
        }
    }

    /** @return array<int, int> */
    private function recipientIds(RoleType $role): array
    {
        return $this->recipientIds[$role->value] ??= User::query()
            ->whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', [$role->value]))
            ->pluck('id')
            ->all();
    }
}
