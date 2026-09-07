<?php

declare(strict_types=1);

namespace App\Actions\Notification;

use App\Enums\RoleType;
use App\Models\Notification;
use App\Models\User;

/**
 * Fans an in-app notification out to every payment-internal ("kita") user, so
 * each has their own read state. Pass a `dedupeKey` for alerts that must fire
 * only once per recipient (e.g. a subscription's H-7 reminder) — a re-run then
 * no-ops via the (user_id, dedupe_key) unique index.
 */
class NotifyPaymentInternalAction
{
    /** @var array<int, int>|null */
    private ?array $recipientIds = null;

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(string $type, string $title, string $message, array $data = [], ?string $dedupeKey = null): void
    {
        $values = [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data ?: null,
        ];

        foreach ($this->recipientIds() as $userId) {
            if ($dedupeKey === null) {
                // One-off event — always create a fresh row per recipient.
                Notification::create(['user_id' => $userId] + $values);

                continue;
            }

            // De-duplicatable alert — one per (recipient, key); re-runs no-op.
            Notification::firstOrCreate(
                ['user_id' => $userId, 'dedupe_key' => $dedupeKey],
                $values,
            );
        }
    }

    /** @return array<int, int> */
    private function recipientIds(): array
    {
        return $this->recipientIds ??= User::query()
            ->whereHas('role', fn ($q) => $q->whereRaw('LOWER(name) = ?', [RoleType::PAYMENT_INTERNAL->value]))
            ->pluck('id')
            ->all();
    }
}
