<?php

declare(strict_types=1);

namespace App\Actions\Hub;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushLicenceRenewalJob;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Setting;
use App\Services\HubClient;
use App\Support\Payment\DefaultMerchant;
use App\Support\Payment\WebsiteService;
use App\Support\SiteLicenceState;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Pulls this site's own licence from the Hub and applies it locally.
 *
 * The licence sibling of SyncCatalogFromHubAction, and the same discipline: the
 * Hub is the authority, we align to it, and a failure throws rather than
 * silently writing an empty answer. What it lands is two different kinds of
 * fact, on purpose:
 *
 *  - the GATE (suspended? expired?) into settings, because that is what the
 *    middleware reads on every public request and it must be cheap;
 *  - the TERM as a single ServiceSubscription row, because that is what the
 *    admin sidebar card and the client's "Langganan Saya" tab already read.
 *    Writing it anywhere else would mean building two new read paths to show
 *    the client something the app can already display.
 *
 * The subscription row is updated in place, never stacked. Renewals stack at
 * the Hub; stacking the mirror as well would double-count against the
 * `max(ends_at)` that every reader uses.
 */
class ApplyHubLicenceAction
{
    public function __construct(private readonly HubClient $hub) {}

    /** @return array{status: string, suspended: bool, lifetime: bool, ends_at: string|null, subscription: bool} */
    public function execute(): array
    {
        $block = $this->hub->licence();

        $status = is_string($block['status'] ?? null) ? $block['status'] : 'none';
        $endsAt = ! empty($block['ends_at']) ? Carbon::parse($block['ends_at']) : null;
        $startsAt = ! empty($block['starts_at']) ? Carbon::parse($block['starts_at']) : null;
        // A licence bought outright. Reported BESIDE `ends_at` (which is null for
        // one) because on its own a null end date cannot be told apart from "no
        // term was ever set" — the Hub has the same problem, solved the same way.
        $lifetime = (bool) ($block['lifetime'] ?? false);
        // `is_serving` is the Hub's own verdict rather than something we
        // recompute: it already folds in de-registration, suspension and the
        // date, and a second opinion here could only ever disagree.
        $serving = (bool) ($block['is_serving'] ?? true);

        DB::transaction(function () use ($block, $status, $endsAt, $startsAt, $serving, $lifetime) {
            $this->writeGate($block, $status, $endsAt, $serving, $lifetime);
            $this->writeSubscription($startsAt, $endsAt, $lifetime);
        });

        SiteLicenceState::forget();

        $this->reportUnacknowledgedLicence($block);

        return [
            'status' => $status,
            'suspended' => (bool) ($block['suspended'] ?? false),
            'lifetime' => $lifetime,
            'ends_at' => $endsAt?->toIso8601String(),
            'subscription' => $lifetime || $endsAt !== null,
        ];
    }

    /**
     * Tell the Hub again about a licence bill it never acknowledged.
     *
     * The report is ONE-SHOT: a bill settled while the dispatch was broken — or
     * while the Hub was permanently unreachable — would otherwise leave a client
     * who has PAID staring at a dark site, with nothing anywhere reporting a
     * problem. Re-sending is safe, because the Hub de-dupes on the invoice number
     * and a redelivery cannot buy a second term.
     *
     * It fires ONLY on this exact mismatch: the Hub says we hold no licence at
     * all, yet we hold a paid bill for one. A LAPSED licence has an end date, so
     * it never lands here; a site that has never paid has nothing to re-send; and
     * a lifetime grant carries its own flag. That is what keeps this from being a
     * push every minute forever.
     *
     * @param  array<string, mixed>  $block
     */
    private function reportUnacknowledgedLicence(array $block): void
    {
        $status = is_string($block['status'] ?? null) ? $block['status'] : 'none';

        if ($status !== 'none' || (bool) ($block['lifetime'] ?? false)) {
            return;
        }

        // Found by what the bill IS, not by a service code: a paid bill whose
        // plan line governs the term. Resolving "my licence service" first would
        // make the heal depend on the site having already learned that code —
        // which is exactly what it may not have done yet.
        $invoice = ServiceInvoice::query()
            ->where('status', ServiceInvoiceStatus::PAID)
            ->whereHas('hubPlanItem', fn ($query) => $query->where('governs_licence', true))
            ->latest('id')
            ->first();

        if ($invoice !== null) {
            Log::info('Hub licence unacknowledged — reporting it again', [
                'invoice_number' => $invoice->invoice_number,
            ]);

            PushLicenceRenewalJob::maybeDispatch($invoice);
        }
    }

    /**
     * The facts the gate reads. Private settings — this is operational state,
     * not something an admin edits in the settings form.
     *
     * @param  array<string, mixed>  $block
     */
    private function writeGate(array $block, string $status, ?Carbon $endsAt, bool $serving, bool $lifetime): void
    {
        $values = [
            'is_serving' => $serving ? '1' : '0',
            'status' => $status,
            'suspend_reason' => (string) ($block['suspend_reason'] ?? ''),
            'ends_at' => $endsAt?->toIso8601String() ?? '',
            // Stored so the panel can say "Seumur hidup" instead of rendering an
            // empty date — an empty date reads as "not set up", which is the
            // opposite of paid up for good.
            'lifetime' => $lifetime ? '1' : '0',
            'checkout_url' => (string) ($block['checkout_url'] ?? ''),
            'synced_at' => now()->toIso8601String(),
        ];

        foreach ($values as $key => $value) {
            Setting::updateOrCreate(
                ['group' => SiteLicenceState::GROUP, 'key' => $key],
                [
                    'value' => $value,
                    'type' => in_array($key, ['is_serving', 'lifetime'], true) ? 'boolean' : 'string',
                    'label' => 'Lisensi situs: '.$key,
                    'is_public' => false,
                ],
            );
        }
    }

    /**
     * Materialise the term as the site's own subscription.
     *
     * Skipped — not cleared — when billing is not wired up (no default merchant
     * or no website service in the catalog). A site mid-setup has nothing to
     * show, and inventing a row for a merchant that does not exist would be
     * worse than showing nothing.
     *
     * A LIFETIME licence writes `ends_at = null`, and is therefore written even
     * though there is no date: the null IS the term. Skipping it would leave the
     * client's own card reading "belum berlangganan" on a site somebody paid for
     * outright.
     */
    private function writeSubscription(?Carbon $startsAt, ?Carbon $endsAt, bool $lifetime): void
    {
        $merchantId = DefaultMerchant::id();
        $service = WebsiteService::get();

        if (! $lifetime && $endsAt === null) {
            return;
        }

        if (! $merchantId || ! $service) {
            return;
        }

        ServiceSubscription::updateOrCreate(
            ['merchant_id' => $merchantId, 'service_id' => $service->id, 'source' => 'hub'],
            [
                // No invoice: this term was granted at the Hub, not bought here.
                // The column is nullable for exactly this case.
                'service_invoice_id' => null,
                'starts_at' => $startsAt ?? now(),
                // NULL is the lifetime sentinel; see the migration.
                'ends_at' => $lifetime ? null : $endsAt,
                // Deliberately reset on every sync. `services:expire` flips this
                // row to EXPIRED overnight once the term lapses — correct while
                // it is lapsed, and fatal afterwards if a renewal left it that
                // way, because the admin card only reads ACTIVE rows.
                'status' => SubscriptionStatus::ACTIVE,
            ],
        );
    }
}
