<?php

declare(strict_types=1);

namespace App\Actions\Hub;

use App\Enums\ServiceCategory;
use App\Models\Service;
use App\Services\HubClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Aligns the local service catalog with the Hub's master copy.
 *
 * The rules this encodes are the brief's hard rules for a centralized catalog:
 *  - matched by `code` (unique, stable) — never by id, which differs per site;
 *  - NEVER deletes: a code the Hub no longer sends is deactivated. The FKs on
 *    invoices/subscriptions cascade on delete, so a sync that deleted would
 *    take billing history with it;
 *  - `cost_price` is not in the Hub payload (margin data stays at the Hub) and
 *    is left untouched locally;
 *  - `payment_channel_id` points at per-site local data and is never synced.
 */
class SyncCatalogFromHubAction
{
    public function __construct(private readonly HubClient $hub) {}

    /** @return array{created: int, updated: int, deactivated: int} */
    public function execute(): array
    {
        $payload = $this->hub->catalog();

        return DB::transaction(function () use ($payload) {
            $created = 0;
            $updated = 0;
            $seenCodes = [];

            foreach ($payload as $row) {
                $code = (string) ($row['code'] ?? '');
                if ($code === '') {
                    Log::warning('Hub catalog row without a code skipped', ['row' => $row]);

                    continue;
                }

                $seenCodes[] = $code;

                // The Hub is only supposed to send categories this enum holds,
                // but this sync runs in ONE transaction: an uncastable value
                // would throw and take the WHOLE catalog with it, leaving the
                // site with no services to resolve, every plan line skipped for
                // an unknown code, and billing stopped with only a log line to
                // say why. Degrade the row instead — "other" is the honest
                // bucket, and the alternative costs the whole site its catalog.
                $category = ServiceCategory::tryFrom((string) ($row['category'] ?? ''));

                if ($category === null) {
                    Log::warning('Hub catalog row carried a category this site cannot cast', [
                        'code' => $code,
                        'category' => $row['category'] ?? null,
                    ]);

                    $category = ServiceCategory::OTHER;
                }

                $attributes = [
                    'name' => (string) $row['name'],
                    'category' => $category,
                    'description' => $row['description'] ?? null,
                    'features' => $row['features'] ?? null,
                    'selling_price' => (int) $row['selling_price'],
                    'duration_days' => (int) $row['duration_days'],
                    'is_active' => (bool) ($row['is_active'] ?? true),
                    'sort_order' => (int) ($row['sort_order'] ?? 0),
                ];

                $service = Service::where('code', $code)->first();

                if ($service === null) {
                    Service::create($attributes + ['code' => $code, 'cost_price' => 0]);
                    $created++;
                } else {
                    $service->update($attributes);
                    $updated++;
                }
            }

            // Codes the Hub stopped sending: deactivate, never delete.
            $deactivated = Service::whereNotIn('code', $seenCodes)
                ->where('is_active', true)
                ->update(['is_active' => false]);

            return ['created' => $created, 'updated' => $updated, 'deactivated' => $deactivated];
        });
    }
}
