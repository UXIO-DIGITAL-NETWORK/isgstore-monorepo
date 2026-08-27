<?php

declare(strict_types=1);

namespace App\Actions\Hub;

use App\Models\PaymentChannel;
use App\Services\HubClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Aligns the local channel fee schedule with the Hub's — MDR, admin fee and
 * tax come from one contract and one pricing policy, set once at the Hub.
 * The Hub sends the EFFECTIVE per-site values (site overrides already applied).
 *
 * The Hub now also owns `is_active` (which channels this site offers) and
 * `min_amount` per site, so those move too when present in the payload —
 * guarded so an older Hub that omits them leaves the local value untouched
 * (additive contract). Names, logo, sort order and payment_type stay local. A
 * channel_code the site doesn't have is skipped with a log line, not created —
 * a channel needs full local configuration to be sellable.
 */
class SyncChannelSettingsFromHubAction
{
    public function __construct(private readonly HubClient $hub) {}

    /** @return array{updated: int, skipped: int} */
    public function execute(): array
    {
        $payload = $this->hub->channelSettings();

        return DB::transaction(function () use ($payload) {
            $updated = 0;
            $skipped = 0;

            foreach ($payload as $row) {
                $code = (string) ($row['channel_code'] ?? '');

                $channel = $code === '' ? null : PaymentChannel::where('channel_code', $code)->first();

                if ($channel === null) {
                    Log::info('Hub channel setting skipped — channel not configured locally', ['channel_code' => $code]);
                    $skipped++;

                    continue;
                }

                $attributes = [
                    'fee_flat' => (int) $row['fee_flat'],
                    'fee_percent' => (float) $row['fee_percent'],
                    'gateway_fee_flat' => (int) $row['gateway_fee_flat'],
                    'gateway_fee_percent' => (float) $row['gateway_fee_percent'],
                    'tax_percent' => (float) $row['tax_percent'],
                ];

                // Hub-owned per-site enablement + minimum — only when the Hub
                // sends them (older Hub omits → local value stays).
                if (array_key_exists('is_active', $row)) {
                    $attributes['is_active'] = (bool) $row['is_active'];
                }
                if (array_key_exists('min_amount', $row)) {
                    $attributes['min_amount'] = (int) $row['min_amount'];
                }

                $channel->update($attributes);
                $updated++;
            }

            return ['updated' => $updated, 'skipped' => $skipped];
        });
    }
}
