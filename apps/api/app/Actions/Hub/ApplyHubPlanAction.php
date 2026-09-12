<?php

declare(strict_types=1);

namespace App\Actions\Hub;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushServiceOrderToHubJob;
use App\Models\HubPlanItem;
use App\Models\Service;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Services\HubClient;
use App\Support\Payment\DefaultMerchant;
use App\Support\Payment\WebsiteService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Turns the Hub's service plan into this site's own bills.
 *
 * The Hub decides WHAT is owed and WHEN it becomes payable; this site issues the
 * invoice, takes the money through its own Monetapay sub-merchant, and reports
 * back. The Hub never creates a row here — it publishes a period, and this runs.
 *
 * THE ONE GUARANTEE: `service_invoices.hub_item_key` is unique, and every bill
 * this action issues carries the Hub's key for that period. Not a date check,
 * not a status check — an index. A sync that runs every fifteen minutes forever
 * therefore issues exactly one invoice per period, and so does a sync racing
 * itself, and so does a sync running while a period is republished.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO:
 *
 *  - It never credits a ledger for a prepaid item. See markPrepaid().
 *  - It never calls ActivateServiceSubscriptionAction for a prepaid item. See
 *    markPrepaid() — that path would ask the Hub to extend the term a SECOND
 *    time on top of the one registration already granted.
 *  - It never writes the `source='hub'` subscription row for the website
 *    service. That row belongs to ApplyHubLicenceAction, which mirrors the
 *    Hub's own term; two writers would double-count against the MAX(ends_at)
 *    every reader uses.
 */
class ApplyHubPlanAction
{
    public function __construct(private readonly HubClient $hub) {}

    /** @return array{issued: int, reopened: int, prepaid: int, skipped: int} */
    public function execute(): array
    {
        $rows = $this->hub->plan();

        $merchantId = DefaultMerchant::id();

        if ($merchantId === null) {
            // A site mid-setup has no payment-admin user yet, and
            // `service_invoices.merchant_id` is NOT NULL. Stopping quietly is
            // right: the next sync finishes the job, and a half-provisioned
            // site must not fail the command it shares with other work.
            Log::warning('Hub plan sync skipped — no default merchant yet');

            return ['issued' => 0, 'reopened' => 0, 'prepaid' => 0, 'skipped' => count($rows)];
        }

        $result = ['issued' => 0, 'reopened' => 0, 'prepaid' => 0, 'skipped' => 0];
        $websiteCode = WebsiteService::code();

        foreach ($rows as $row) {
            $item = $this->rememberItem($row);

            if ($item === null) {
                $result['skipped']++;

                continue;
            }

            $service = Service::where('code', $item->service_code)->first();

            if ($service === null) {
                // `hub:sync-catalog` runs on its own schedule; a code we have
                // never seen means it has not landed yet. Next tick.
                Log::info('Hub plan period skipped — unknown service code', [
                    'item_key' => $item->item_key,
                    'service_code' => $item->service_code,
                ]);
                $result['skipped']++;

                continue;
            }

            $outcome = $item->isPrepaid()
                ? $this->markPrepaid($item, $service, $merchantId, $websiteCode)
                : $this->issue($item, $service, $merchantId);

            $result[$outcome]++;
        }

        return $result;
    }

    /**
     * Cache what the Hub said, keyed on the period key.
     *
     * Kept locally for three reasons: the payment page can show "what you must
     * renew, and when" without a live Hub call; there is a record of what the
     * Hub actually said when someone asks why a client was billed; and billing
     * survives a Hub outage, which otherwise would quietly mean nobody gets
     * billed while the Hub is down.
     *
     * @param  array<string, mixed>  $row
     */
    private function rememberItem(array $row): ?HubPlanItem
    {
        $key = (string) ($row['item_key'] ?? '');

        if ($key === '' || empty($row['service_code'])) {
            Log::warning('Hub plan row without a key skipped', ['row' => $row]);

            return null;
        }

        return HubPlanItem::updateOrCreate(['item_key' => $key], [
            'plan_uid' => (string) ($row['plan_uid'] ?? Str::before($key, ':')),
            'period_index' => (int) ($row['period_index'] ?? 0),
            'service_code' => (string) $row['service_code'],
            'service_name' => (string) ($row['service_name'] ?? $row['service_code']),
            // The Hub's per-site negotiated figure. NEVER services.selling_price
            // — billing from the local catalog would charge every client who
            // negotiated a price the list price instead, on every renewal.
            'amount' => (int) ($row['amount'] ?? 0),
            'duration_days' => (int) ($row['duration_days'] ?? 30),
            'billing_mode' => (string) ($row['billing_mode'] ?? 'billed'),
            'period_starts_at' => Carbon::parse((string) $row['period_starts_at']),
            'period_ends_at' => Carbon::parse((string) $row['period_ends_at']),
            'due_at' => empty($row['due_at']) ? null : Carbon::parse((string) $row['due_at']),
            'governs_licence' => (bool) ($row['governs_licence'] ?? false),
            'is_active' => (bool) ($row['is_active'] ?? true),
            'synced_at' => now(),
        ]);
    }

    /** @return 'issued'|'reopened'|'skipped' */
    private function issue(HubPlanItem $item, Service $service, int $merchantId): string
    {
        return DB::transaction(function () use ($item, $service, $merchantId) {
            $existing = ServiceInvoice::where('hub_item_key', $item->item_key)->lockForUpdate()->first();

            if ($existing !== null) {
                return $this->reopenIfStranded($existing, $item);
            }

            // The site's own rule, honoured rather than bypassed: one open bill
            // per (client, service). Issuing a renewal on top of a bill the
            // client is already looking at would leave them two invoices for one
            // thing and no way to tell which to pay.
            $hasOpen = ServiceInvoice::where('merchant_id', $merchantId)
                ->where('service_id', $service->id)
                ->whereIn('status', [ServiceInvoiceStatus::UNPAID, ServiceInvoiceStatus::WAITING_CONFIRMATION])
                ->exists();

            if ($hasOpen) {
                return 'skipped';
            }

            $invoice = ServiceInvoice::create([
                'invoice_number' => $this->invoiceNumber(),
                'merchant_id' => $merchantId,
                'service_id' => $service->id,
                'hub_item_key' => $item->item_key,
                'hub_plan_uid' => $item->plan_uid,
                'service_name' => $item->service_name,
                'amount' => (int) $item->amount,
                'duration_days' => (int) $item->duration_days,
                'period_starts_at' => $item->period_starts_at,
                'period_ends_at' => $item->period_ends_at,
                'status' => ServiceInvoiceStatus::UNPAID,
                'due_at' => $item->due_at,
                'source' => 'hub_plan',
            ]);

            // Tell the Hub an order exists, still UNPAID — the same push a
            // client's own purchase makes, so the Hub's queue is live either way.
            PushServiceOrderToHubJob::maybeDispatch($invoice);

            return 'issued';
        });
    }

    /**
     * A bill this site issued and then closed on itself.
     *
     * `services:expire` used to sweep any UNPAID invoice past `due_at` into
     * EXPIRED. Combined with the unique key that would be a trap with no way
     * out: the period could never be re-issued, and the client could never pay
     * it. The sweep now skips plan bills, and this heals the ones it already
     * closed. Only EXPIRED is reopened — CANCELLED and REJECTED were decisions
     * somebody made, and reversing those is not a sync's business.
     *
     * @return 'reopened'|'skipped'
     */
    private function reopenIfStranded(ServiceInvoice $invoice, HubPlanItem $item): string
    {
        if ($invoice->status !== ServiceInvoiceStatus::EXPIRED) {
            return 'skipped';
        }

        $invoice->update([
            'status' => ServiceInvoiceStatus::UNPAID,
            'due_at' => $item->due_at !== null && $item->due_at->isFuture()
                ? $item->due_at
                : now()->addDays((int) config('services.service_invoice.due_days', 3)),
        ]);

        return 'reopened';
    }

    /**
     * A period the client settled with kita outside this system, recorded by an
     * operator when the site was registered.
     *
     * FOUR things this must not do, and each of them is a real defect:
     *
     *  1. It must not credit `ServiceRevenueLedger`. That writes
     *     `platform_ledger`, which drives `PlatformBalance::available()` — money
     *     kita can WITHDRAW, and the figure the Hub's reconciliation page
     *     compares against the real Monetapay balance. This money never entered
     *     the sub-merchant, so crediting it would authorise a withdrawal against
     *     cash that is not there and manufacture a reconciliation gap.
     *     It is still counted as service revenue where that is honest:
     *     `HubReportController::summary()` sums `service_invoices.amount` for
     *     PAID bills, so the invoice alone is enough.
     *
     *  2. It must not call `ActivateServiceSubscriptionAction`. That dispatches
     *     `PushLicenceRenewalJob`, which for the website service would ask the
     *     Hub to extend the term a SECOND time — on top of the term the Hub
     *     granted from this very prepaid line at registration. A free year.
     *
     *  3. It must not stack on MAX(ends_at). The operator chose the start date;
     *     stacking would quietly move it.
     *
     *  4. It must not write a subscription for the WEBSITE service at all. That
     *     row is `ApplyHubLicenceAction`'s, mirroring the Hub's term in place.
     *
     * @return 'prepaid'|'skipped'
     */
    private function markPrepaid(HubPlanItem $item, Service $service, int $merchantId, string $websiteCode): string
    {
        return DB::transaction(function () use ($item, $service, $merchantId, $websiteCode) {
            $invoice = ServiceInvoice::where('hub_item_key', $item->item_key)->lockForUpdate()->first();

            if ($invoice === null) {
                $invoice = ServiceInvoice::create([
                    'invoice_number' => $this->invoiceNumber(),
                    'merchant_id' => $merchantId,
                    'service_id' => $service->id,
                    'hub_item_key' => $item->item_key,
                    'hub_plan_uid' => $item->plan_uid,
                    'service_name' => $item->service_name,
                    // What was actually handed over, as the operator entered it.
                    'amount' => (int) $item->amount,
                    'duration_days' => (int) $item->duration_days,
                    'period_starts_at' => $item->period_starts_at,
                    'period_ends_at' => $item->period_ends_at,
                    'status' => ServiceInvoiceStatus::PAID,
                    // When the money moved, not when we recorded it: the monthly
                    // service-revenue figure buckets on this column.
                    'verified_at' => $item->period_starts_at,
                    'settled_offline' => true,
                    'source' => 'hub_plan',
                    'notes' => 'Dibayar di awal (di luar sistem) — dicatat dari Hub',
                ]);
            } elseif ($invoice->status !== ServiceInvoiceStatus::PAID) {
                $invoice->update([
                    'status' => ServiceInvoiceStatus::PAID,
                    'verified_at' => $item->period_starts_at,
                    'settled_offline' => true,
                ]);
            }

            if ($item->service_code !== $websiteCode) {
                ServiceSubscription::updateOrCreate(
                    ['service_invoice_id' => $invoice->id],
                    [
                        'merchant_id' => $merchantId,
                        'service_id' => $service->id,
                        'source' => 'hub',
                        'starts_at' => $item->period_starts_at,
                        'ends_at' => $item->period_ends_at,
                        'status' => SubscriptionStatus::ACTIVE,
                    ],
                );
            }

            return 'prepaid';
        });
    }

    /**
     * The same generator `SubscribeToServiceAction` uses, retried.
     *
     * Six random characters against a unique column is a gamble that is fine
     * when a person is watching and gets a 500 they can retry. This runs
     * unattended every fifteen minutes, so a collision has to heal itself.
     */
    private function invoiceNumber(): string
    {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $number = 'SINV-'.date('Ym').'-'.strtoupper(Str::random(6));

            if (! ServiceInvoice::where('invoice_number', $number)->exists()) {
                return $number;
            }
        }

        return 'SINV-'.date('Ym').'-'.strtoupper(Str::random(10));
    }
}
