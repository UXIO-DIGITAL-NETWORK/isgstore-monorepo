<?php

declare(strict_types=1);

namespace App\Actions\Hub;

use App\Models\PaymentChannel;
use App\Services\DiscordWebhookService;
use App\Services\HubClient;
use App\Support\Payment\MonetapayContractFees;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Aligns the local channel fee schedule with the Hub's — MDR, admin fee, tax,
 * enablement and minimum come from one contract and one pricing policy, set
 * once at the Hub. The Hub sends the EFFECTIVE per-site values (site overrides
 * already applied).
 *
 * A channel_code the site has never seen is now CREATED, not skipped, so a new
 * payment method can be rolled out to five sites from one form. Two rules keep
 * that from becoming a way to break checkout from an admin panel:
 *
 *   1. It is only created ACTIVE if the code exists in MonetapayContractFees.
 *      An unlisted code is a code MonetapayService would send raw to the
 *      gateway (and whose payment would fail), AND one MerchantBalance settles
 *      at T+0 — meaning a merchant could withdraw money Monetapay has not
 *      released yet. So it lands inactive and waits for finance to add the
 *      contract row; the next sync then switches it on by itself.
 *   2. payment_type is taken on CREATE only, never on update. It selects the
 *      gateway endpoint, and MonetapayService's match() falls through to
 *      virtual_account — so a typo at the Hub would not error, it would
 *      silently misroute a live, proven channel.
 *
 * Names come down always (central naming is the point). Logo, sort order,
 * description and extra_config stay local. Nothing is ever deleted: a code the
 * Hub stops sending is simply left alone, because the Hub sends inactive rows
 * too — absence means "not the Hub's business", not "retire it".
 */
class SyncChannelSettingsFromHubAction
{
    public function __construct(
        private readonly HubClient $hub,
        private readonly DiscordWebhookService $discord,
    ) {}

    /** @return array{created: int, updated: int, skipped: int} */
    public function execute(): array
    {
        $payload = $this->hub->channelSettings();

        return DB::transaction(function () use ($payload) {
            $created = 0;
            $updated = 0;
            $skipped = 0;

            foreach ($payload as $row) {
                $code = (string) ($row['channel_code'] ?? '');

                $channel = $code === '' ? null : PaymentChannel::where('channel_code', $code)->first();

                if ($channel === null) {
                    // An older Hub sends fees without identity — there is not
                    // enough here to build a sellable row, so keep the old
                    // skip-and-log behaviour rather than guessing a name.
                    if ($code === '' || ! isset($row['name'], $row['payment_type'])) {
                        Log::info('Hub channel setting skipped — payload lacks name/payment_type to create', ['channel_code' => $code]);
                        $skipped++;

                        continue;
                    }

                    PaymentChannel::create($this->attributes($row, $code) + [
                        'channel_code' => $code,
                        'payment_type' => (string) $row['payment_type'],
                        // Local presentation and gateway behaviour: the Hub has
                        // no opinion on these, and the storefront resolves logos
                        // from the channel_code anyway.
                        'logo_path' => null,
                        'description' => null,
                        'sort_order' => 0,
                        'is_single_use' => true,
                        'extra_config' => null,
                    ]);
                    $created++;

                    if (! in_array($row['payment_type'], PaymentChannel::ALLOWED_STOREFRONT_PAYMENT_TYPES, true)) {
                        Log::warning('Hub channel created with a payment_type the storefront does not offer', [
                            'channel_code' => $code,
                            'payment_type' => $row['payment_type'],
                        ]);
                    }

                    continue;
                }

                $channel->update($this->attributes($row, $code));
                $updated++;
            }

            return ['created' => $created, 'updated' => $updated, 'skipped' => $skipped];
        });
    }

    /**
     * The columns the Hub owns on both create and update.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function attributes(array $row, string $code): array
    {
        $attributes = [
            'fee_flat' => (int) $row['fee_flat'],
            'fee_percent' => (float) $row['fee_percent'],
            'gateway_fee_flat' => (int) $row['gateway_fee_flat'],
            'gateway_fee_percent' => (float) $row['gateway_fee_percent'],
            'tax_percent' => (float) $row['tax_percent'],
            'hub_managed' => true,
        ];

        // Display name is Hub-owned; payment_type deliberately is not (rule 2).
        if (array_key_exists('name', $row)) {
            $attributes['name'] = (string) $row['name'];
        }

        // Hub-owned per-site enablement + minimum — only when the Hub sends
        // them (older Hub omits → local value stays).
        if (array_key_exists('is_active', $row)) {
            $attributes['is_active'] = $this->gatedActive($code, (bool) $row['is_active']);
        }
        if (array_key_exists('min_amount', $row)) {
            $attributes['min_amount'] = (int) $row['min_amount'];
        }

        return $attributes;
    }

    /**
     * The contract gate (rule 1). Turning a channel OFF always works — only
     * turning one ON needs a contracted rate behind it.
     */
    private function gatedActive(string $code, bool $wanted): bool
    {
        if (! $wanted || MonetapayContractFees::has($code)) {
            return $wanted;
        }

        // The scheduler runs this 96x a day; alert once per code per day or the
        // channel becomes noise and stops being read.
        $alerted = Cache::add("hub:channel-contract-alert:{$code}:".now()->toDateString(), true, now()->endOfDay());

        Log::warning('Hub asked to activate a channel absent from the Monetapay contract — kept inactive', ['channel_code' => $code]);

        if ($alerted) {
            $this->discord->sendAlert(
                "Channel '{$code}' dari Hub belum ada di kontrak Monetapay — dibuat/dibiarkan NONAKTIF. "
                .'Tambahkan ke MonetapayContractFees (termasuk settlement_days) sebelum dijual, '
                .'kalau tidak pembayarannya gagal dan saldonya dianggap cair T+0.'
            );
        }

        return false;
    }
}
