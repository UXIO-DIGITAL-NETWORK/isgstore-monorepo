<?php

namespace App\Http\Controllers\Api\Hub;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\GatewayBalanceSnapshot;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\PlatformMutation;
use App\Models\ServiceInstallation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
use App\Services\UxiolabsService;
use App\Support\Integration\IntegrationConfig;
use App\Support\Payment\DefaultMerchant;
use App\Support\Payment\WebsiteSubscriptionStatus;
use App\Support\Payout\BankCatalog;
use App\Support\Wallet\MerchantBalance;
use App\Support\Wallet\PlatformBalance;
use App\Support\Withdrawal\WithdrawalFeeCalculator;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * The site's reporting contract for the Uxio Hub — read-only summaries the Hub
 * pulls on a schedule. Gated by the `hub` middleware (X-Hub-Key + optional IP
 * allowlist); nothing here can change state.
 *
 * CONTRACT RULE — additive only. Sites run different deploy versions at any
 * moment, so a field may be ADDED but never renamed or removed; the Hub treats
 * a missing field as null. Breaking this rule silently corrupts the Hub's
 * aggregation for every site still on the old version.
 */
class HubReportController extends Controller
{
    use ApiResponse;

    /** Withdrawals that have not reached a terminal state. */
    private const OPEN_STATUSES = [
        WithdrawalStatus::PENDING,
        WithdrawalStatus::APPROVED,
        WithdrawalStatus::PROCESSING,
    ];

    /** GET /v1/hub/summary — the site's headline numbers, one pull per card refresh. */
    public function summary()
    {
        $pending = Withdrawal::where('status', WithdrawalStatus::PENDING);
        $oldestPendingAt = $pending->clone()->min('created_at');

        return $this->successResponse([
            'generated_at' => now()->toIso8601String(),
            'profit_total' => PlatformBalance::income(),
            'platform_available' => PlatformBalance::available(),
            'pending_withdrawals_count' => (int) $pending->clone()->count(),
            'pending_withdrawals_amount' => (int) $pending->clone()->sum('amount'),
            'oldest_pending_minutes' => $oldestPendingAt
                ? (int) Carbon::parse($oldestPendingAt)->diffInMinutes(now())
                : null,
            // `active()` rather than a hand-written date comparison: it is the
            // one definition of the window, and it already counts a lifetime
            // subscription (NULL ends_at) as active — which a raw
            // `ends_at > now()` would silently drop.
            'active_subscriptions_count' => (int) ServiceSubscription::query()
                ->active()
                ->count(),
            'paid_service_invoices_this_month' => (int) ServiceInvoice::query()
                ->where('status', ServiceInvoiceStatus::PAID)
                ->whereBetween('verified_at', [now()->startOfMonth(), now()])
                ->sum('amount'),
            // The gateway's own view of this site's sub-merchant balance, for
            // Hub-side reconciliation against the ledger. Null when the gateway
            // is unreachable — a summary pull must never fail because Monetapay
            // is slow.
            'gateway_balance' => $this->gatewayBalance(),
            // This site's OWN yearly licence — not `active_subscriptions_count`
            // above, which counts the merchants subscribed *on* this site. The
            // Hub needs the site's own expiry to chase a renewal before the
            // deployment lapses, and reads the identical answer the site's own
            // sidebar card shows. Never throws: unconfigured billing is a
            // status string, not a failed pull.
            'website_subscription' => WebsiteSubscriptionStatus::resolve(),
            // Finance breakdown so the Hub can render the same headline cards the
            // site's own payment-internal dashboard shows. Additive to this
            // contract; older sites simply omit these keys.
            ...$this->financeBreakdown(),
        ], 'Site summary');
    }

    /**
     * The profit breakdown the payment-internal dashboard shows, computed with
     * the SAME queries as FinanceDashboardController::index so the Hub can never
     * disagree with the site panel about the same numbers.
     *
     * @return array<string, int>
     */
    private function financeBreakdown(): array
    {
        // Only paid transactions represent money actually collected — the
        // ledger-backed saldo settles at PAID; pending/failed rows would overstate.
        $paid = Transaction::whereNotNull('merchant_id')
            ->whereIn('status', TransactionStatus::paidStates());

        $paidPayments = fn () => Payment::whereIn('transaction_id', $paid->clone()->select('id'));

        return [
            'total_admin_fee' => (int) $paid->clone()->sum('amount_fee'),
            'total_gateway_fee' => (int) $paidPayments()->sum('gateway_fee'),
            'total_tax' => (int) $paidPayments()->sum('tax_amount'),
            'total_settled_to_merchants' => (int) $paid->clone()->sum('amount_base'),
            'total_transactions_count' => (int) Transaction::whereNotNull('merchant_id')->count(),
            'total_transactions_amount' => (int) $paid->clone()->sum('amount_base'),
        ];
    }

    /** GET /v1/hub/withdrawals — the queue that needs eyes: everything open, plus recent terminal rows. */
    public function withdrawals()
    {
        $open = Withdrawal::query()
            ->with('merchant:id,name')
            ->whereIn('status', self::OPEN_STATUSES)
            ->orderBy('created_at')
            ->get();

        $recentTerminal = Withdrawal::query()
            ->with('merchant:id,name')
            ->whereNotIn('status', self::OPEN_STATUSES)
            ->latest('id')
            ->limit(50)
            ->get();

        $rows = $open->concat($recentTerminal)->map(fn (Withdrawal $w) => [
            'withdrawal_number' => $w->withdrawal_number,
            'amount' => (int) $w->amount,
            'nett' => (int) $w->nett,
            'status' => $w->status?->value,
            // merchant_id null = an internal (kita) withdrawal.
            'type' => $w->merchant_id === null ? 'internal' : 'merchant',
            'merchant_name' => $w->merchant?->name,
            'requested_at' => $w->created_at?->toIso8601String(),
            'age_minutes' => $w->created_at ? (int) $w->created_at->diffInMinutes(now()) : null,
        ])->values();

        return $this->successResponse($rows, 'Withdrawals');
    }

    /** GET /v1/hub/service-orders — recent service invoices for the Hub's order queue. */
    public function serviceOrders()
    {
        $rows = ServiceInvoice::query()
            ->with(['merchant:id,name', 'service:id,code'])
            ->where('created_at', '>=', now()->subDays(90))
            ->latest('id')
            ->limit(500)
            ->get()
            ->map(fn (ServiceInvoice $invoice) => [
                'invoice_number' => $invoice->invoice_number,
                'service_code' => $invoice->service?->code,
                'service_name' => $invoice->service_name,
                'amount' => (int) $invoice->amount,
                'status' => $invoice->status?->value,
                'merchant_name' => $invoice->merchant?->name,
                'ordered_at' => $invoice->created_at?->toIso8601String(),
            ]);

        return $this->successResponse($rows, 'Service orders');
    }

    /** GET /v1/hub/profit?days= — platform income grouped by date and source type. */
    public function profit(Request $request)
    {
        $days = min(366, max(1, (int) $request->query('days', 30)));

        $rows = PlatformMutation::query()
            ->selectRaw('DATE(created_at) as date, type, SUM(amount) as total')
            ->whereIn('type', ['markup', 'withdrawal_fee', 'service_revenue'])
            ->where('created_at', '>=', now()->subDays($days)->startOfDay())
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => (string) $row->date,
                'type' => $row->type,
                'total' => (int) $row->total,
            ]);

        return $this->successResponse($rows, 'Profit entries');
    }

    /** GET /v1/hub/channels — the effective fee schedule this site charges, for the Hub's margin guard. */
    public function channels()
    {
        $rows = PaymentChannel::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($c) => [
                'channel_code' => $c->channel_code,
                'name' => $c->name,
                'payment_type' => $c->payment_type,
                'fee_flat' => (int) $c->fee_flat,
                'fee_percent' => (float) $c->fee_percent,
                'gateway_fee_flat' => (int) $c->gateway_fee_flat,
                'gateway_fee_percent' => (float) $c->gateway_fee_percent,
                'tax_percent' => (float) $c->tax_percent,
                'is_active' => (bool) $c->is_active,
            ]);

        return $this->successResponse($rows, 'Channels');
    }

    /**
     * Everything the Hub's "Penarikan Internal" form needs to render honestly
     * for THIS site: the withdrawable balance, our fee, our floor, and our
     * payout catalogue.
     *
     * Read live rather than from the Hub's mirrored snapshot because the mirror
     * lags by up to a pull cycle and the operator is about to move money against
     * this number. Served on the read channel (X-Hub-Key only): it changes
     * nothing, and gating it behind the write key would blind the form on a site
     * that has HUB_WRITE_ENABLED off — which still deserves to show a balance.
     *
     * The site stays the authority on all four values; the Hub must not
     * hardcode a fee or carry its own bank list.
     */
    public function withdrawalContext()
    {
        return $this->successResponse([
            'available' => PlatformBalance::available(),
            'fee' => WithdrawalFeeCalculator::fee(),
            'min_amount' => max(1, (int) config('services.withdrawal.min_amount', 1)),
            'banks' => collect(BankCatalog::codes())
                ->map(fn (string $code) => [
                    'code' => $code,
                    'name' => BankCatalog::name($code),
                    'is_ewallet' => BankCatalog::isEwallet($code),
                ])
                ->values()
                ->all(),
        ], 'Withdrawal context');
    }

    /**
     * GET /v1/hub/balances — what this site's merchant can actually withdraw, by
     * our own sales rules.
     *
     * The Hub already mirrors this site's Monetapay SUB-MERCHANT balance, which
     * answers "what is sitting at the gateway". It cannot answer "what is the
     * merchant's to take", because that is derived HERE: paid sales that have
     * cleared their channel's settlement window plus the fraud buffer, minus every
     * non-refunded withdrawal. `MerchantBalance` is the single definition of that
     * figure, and it is exposed rather than recomputed on the Hub — which holds
     * none of the transactions the rule is about.
     *
     * Deliberately makes no gateway call: settlement is a ledger question, not a
     * live one, and the Hub's balance pull already carries its own 15s timeout.
     *
     * Additive to the reporting contract: a Hub that does not know this route
     * never calls it, and a null figure means unknown — never zero.
     */
    public function balances()
    {
        $merchantId = DefaultMerchant::id();
        $buffer = max(0, (int) config('services.withdrawal.hold_buffer_days', 1));

        if ($merchantId === null) {
            // No merchant on this site yet: the merchant figures are unknown,
            // while the platform's own profit still is not.
            return $this->successResponse([
                'merchant_available' => null,
                'merchant_held' => null,
                'sales_total' => null,
                'withdrawn_hold' => null,
                'platform_available' => PlatformBalance::available(),
                'hold_buffer_days' => $buffer,
                'captured_at' => now()->toIso8601String(),
            ], 'Balances');
        }

        return $this->successResponse([
            // Withdrawable now: settled sales minus withdrawals that still hold money.
            'merchant_available' => MerchantBalance::available($merchantId),
            // Earned but still inside the holding period — the merchant's "Saldo Tertahan".
            'merchant_held' => MerchantBalance::heldSalesTotal($merchantId),
            'sales_total' => MerchantBalance::salesTotal($merchantId),
            'withdrawn_hold' => MerchantBalance::withdrawnHold($merchantId),
            // kita's own profit on this site, beside the merchant's.
            'platform_available' => PlatformBalance::available(),
            'hold_buffer_days' => $buffer,
            'captured_at' => now()->toIso8601String(),
        ], 'Balances');
    }

    /**
     * GET /v1/hub/subscriptions — what this site's owner actually holds, per
     * service.
     *
     * Collapsed to one row per `service_code` at MAX(ends_at), because the Hub's
     * question is "does this site hold service X today". Every individual bill
     * is already mirrored through /v1/hub/service-orders; duplicating that here
     * would give the Hub two answers to one question.
     *
     * Additive to the reporting contract: a Hub that does not know about this
     * route simply never calls it, and one that does treats a 404 from an older
     * site as "no answer", not as a failed pull.
     */
    public function subscriptions()
    {
        $merchantId = DefaultMerchant::id();

        if ($merchantId === null) {
            return $this->successResponse([], 'Subscriptions');
        }

        $rows = ServiceSubscription::query()
            ->with(['service:id,code,name', 'invoice:id,invoice_number,status,amount,hub_item_key'])
            ->where('merchant_id', $merchantId)
            ->orderBy('ends_at')
            ->get()
            ->groupBy(fn (ServiceSubscription $s) => $s->service?->code ?? '')
            ->reject(fn ($group, $code) => $code === '')
            ->map(function ($group, $code) {
                /** @var ServiceSubscription $latest */
                $latest = $group->sortByDesc('ends_at')->first();

                return [
                    'service_code' => $code,
                    'service_name' => $latest->service?->name,
                    'status' => $latest->status?->value,
                    'starts_at' => $latest->starts_at?->toIso8601String(),
                    'ends_at' => $latest->ends_at?->toIso8601String(),
                    'hub_item_key' => $latest->invoice?->hub_item_key,
                    'invoice_number' => $latest->invoice?->invoice_number,
                    'invoice_status' => $latest->invoice?->status?->value,
                    // Null when the period was granted rather than bought — an
                    // unknown value, never a free one.
                    'amount' => $latest->invoice?->amount === null ? null : (int) $latest->invoice->amount,
                    'source' => $latest->source,
                ];
            })
            ->values();

        return $this->successResponse($rows, 'Subscriptions');
    }

    /**
     * GET /v1/hub/installations — how far along kita is on each of this site
     * owner's service installments, the checklist driving the progress, and the
     * credentials handed over (masked — plaintext leaves only via the reveal
     * route).
     *
     * Scoped to the default merchant, exactly like subscriptions(): one site,
     * one owner, so (site, service_code) identifies an installation for the Hub.
     * Progress is DERIVED from the checklist here — never read from a column —
     * so the Hub's mirror cannot drift from the steps behind it.
     *
     * Additive to the reporting contract: a Hub that does not know this route
     * never calls it, and one that does treats a 404 from an older site as "no
     * answer", not a failed pull.
     */
    public function installations()
    {
        $merchantId = DefaultMerchant::id();

        if ($merchantId === null) {
            return $this->successResponse([], 'Installations');
        }

        $rows = ServiceInstallation::query()
            ->with(['service:id,code,name', 'steps.completedBy:id,name', 'details'])
            ->where('merchant_id', $merchantId)
            ->orderBy('id')
            ->get()
            ->map(function (ServiceInstallation $installation) {
                $steps = $installation->steps;
                $total = $steps->count();
                $completed = $steps->whereNotNull('completed_at')->count();

                return [
                    'installation_id' => $installation->id,
                    'service_code' => $installation->service?->code,
                    'service_name' => $installation->service?->name,
                    'starts_at' => $installation->starts_at?->toIso8601String(),
                    'ends_at' => $installation->ends_at?->toIso8601String(),
                    'notes' => $installation->notes,
                    'steps_total' => $total,
                    'steps_completed' => $completed,
                    'progress_percent' => $total > 0 ? (int) round($completed / $total * 100) : 0,
                    // No steps is "nothing planned yet", a different thing from
                    // "planned and not started" — same distinction the panel makes.
                    'status' => match (true) {
                        $total === 0 => 'NOT_STARTED',
                        $completed === $total => 'DONE',
                        default => 'IN_PROGRESS',
                    },
                    'steps' => $steps->map(fn ($step) => [
                        'id' => $step->id,
                        'title' => $step->title,
                        'description' => $step->description,
                        'sort_order' => (int) $step->sort_order,
                        'is_completed' => $step->completed_at !== null,
                        'completed_at' => $step->completed_at?->toIso8601String(),
                        'completed_by' => $step->completedBy?->name,
                    ])->values(),
                    // Masked only. Plaintext is never in this payload — the Hub
                    // fetches it on demand through the reveal route, which is a
                    // throttled POST so it is neither cached nor logged in a URL.
                    'details' => $installation->details->map(fn ($detail) => [
                        'id' => $detail->id,
                        'label' => $detail->label,
                        'is_secret' => (bool) $detail->is_secret,
                        'masked_value' => $detail->is_secret
                            ? $detail->maskedValue()
                            : (string) $detail->value,
                        'sort_order' => (int) $detail->sort_order,
                    ])->values(),
                ];
            })
            ->reject(fn ($row) => $row['service_code'] === null)
            ->values();

        return $this->successResponse($rows, 'Installations');
    }

    /**
     * GET /v1/hub/gateway-balance — a LIVE reading of this site's Monetapay
     * sub-merchant balance.
     *
     * A separate method from gatewayBalance() below, which is deliberately
     * cache-only and must stay that way: it feeds /summary, and Monetapay's 15s
     * inquiry timeout equals the Hub's own pull timeout, so a live call there
     * hangs every mirror in the fleet.
     *
     * Three choices worth keeping:
     *
     *  - `inquiryBalanceCached`, not `inquiryBalance`. It writes the SAME cache
     *    entry /summary reads, so a Hub balance pull WARMS that figure instead of
     *    leaving it stale. The 60s TTL also bounds how often a held-down
     *    "Perbarui" button can actually reach the gateway.
     *  - `?force=1` busts that entry first, so the button genuinely refreshes.
     *  - It answers 200 with `ok: false` on failure, never a 5xx. Reaching us and
     *    the gateway answering are different facts — the same reasoning as the
     *    sync poke's `applied: false` — and a 5xx would make a gateway problem
     *    look like an unreachable site.
     */
    public function liveGatewayBalance(Request $request)
    {
        $currency = 'IDR';

        try {
            if ($request->boolean('force')) {
                Cache::forget(MonetapayService::balanceCacheKey(null, $currency));
                Cache::forget(MonetapayService::mainBalanceCacheKey($currency));
            }

            $response = app(MonetapayService::class)->inquiryBalanceCached(null, $currency);

            // `current_balance` is the real Monetapay 5.1 field; `balance` is
            // kept only for older cached shapes. Same order gatewayBalance()
            // reads, so the two can never disagree about one payload.
            $balance = $response['data']['current_balance']
                ?? $response['data']['balance']
                ?? $response['balance']
                ?? null;

            // Additive to the contract: the parent account's balance rides along
            // so the Hub can show Uxio's own money beside each sub-merchant's.
            // Its own try/catch inside — a parent-account hiccup must not turn a
            // good sub-merchant reading into a failure.
            $main = $this->mainMerchantBalance($currency);

            if (! is_numeric($balance)) {
                return $this->successResponse([
                    'ok' => false,
                    'balance' => null,
                    'currency' => $currency,
                    ...$main,
                    'error' => 'Gateway tidak memberi angka saldo.',
                ], 'Gateway balance');
            }

            $subMerchant = (string) (IntegrationConfig::for('monetapay')['sub_mch_id'] ?? '');

            return $this->successResponse([
                'ok' => true,
                'balance' => (int) round((float) $balance),
                'currency' => $currency,
                'fetched_at' => now()->toIso8601String(),
                // Masked: the Hub only needs to see that the site is trading as
                // the sub-merchant it expects, not the identifier itself.
                'sub_merchant' => $subMerchant === '' ? null : Str::mask($subMerchant, '*', 3, max(0, strlen($subMerchant) - 6)),
                ...$main,
            ], 'Gateway balance');
        } catch (Throwable $e) {
            Log::channel('monetapay')->warning('Live gateway balance failed', ['error' => $e->getMessage()]);

            return $this->successResponse([
                'ok' => false,
                'balance' => null,
                'currency' => $currency,
                'error' => mb_substr($e->getMessage(), 0, 200),
            ], 'Gateway balance');
        }
    }

    /**
     * GET /v1/hub/supplier-balance — a LIVE reading of this site's Uxiotopup
     * (supplier) balance.
     *
     * Its own endpoint, like gateway-balance and for the same reason: /saldo
     * reaches an external service with a 15s timeout, so it must never sit
     * inside the summary pull the Hub runs every minute.
     *
     * Asked with THIS site's own key — every site holds its own supplier
     * account. The Hub stores and renders the answer; it holds no key.
     *
     * Answers 200 with `ok: false` on failure, never a 5xx: reaching us and the
     * supplier answering are different facts, and a 5xx would make a supplier
     * problem look like an unreachable site.
     */
    public function liveSupplierBalance(Request $request)
    {
        $currency = 'IDR';

        try {
            if ($request->boolean('force')) {
                Cache::forget(UxiolabsService::BALANCE_CACHE_KEY);
            }

            // getBalanceCached() returns the uxiolabs `data` object already
            // unwrapped, so the figure is a top-level `saldo`. The nested shape
            // is read too, so a wrapper change upstream does not silently read
            // as "no balance".
            $response = app(UxiolabsService::class)->getBalanceCached();

            $balance = $response['saldo'] ?? $response['data']['saldo'] ?? null;

            if (! is_numeric($balance)) {
                return $this->successResponse([
                    'ok' => false,
                    'balance' => null,
                    'currency' => $currency,
                    'supplier' => 'Uxiotopup',
                    'error' => 'Supplier tidak memberi angka saldo.',
                ], 'Supplier balance');
            }

            return $this->successResponse([
                'ok' => true,
                'balance' => (int) round((float) $balance),
                'currency' => $currency,
                'supplier' => 'Uxiotopup',
                'fetched_at' => now()->toIso8601String(),
            ], 'Supplier balance');
        } catch (Throwable $e) {
            Log::channel('uxiolabs')->warning('Live supplier balance failed', ['error' => $e->getMessage()]);

            return $this->successResponse([
                'ok' => false,
                'balance' => null,
                'currency' => $currency,
                'supplier' => 'Uxiotopup',
                'error' => mb_substr($e->getMessage(), 0, 200),
            ], 'Supplier balance');
        }
    }

    /**
     * Uxio's own (parent-account) Monetapay balance, read with this site's
     * credentials minus the sub-merchant id.
     *
     * Never throws: a parent-account hiccup is reported as a null `main_balance`
     * beside the reason, so the sub-merchant figure next to it stays readable.
     * An unknown balance is not zero, and it must not take the whole reading down.
     *
     * @return array{main_balance: int|null, main_error: string|null}
     */
    private function mainMerchantBalance(string $currency): array
    {
        try {
            $response = app(MonetapayService::class)->inquiryMainMerchantBalanceCached($currency);

            $balance = $response['data']['current_balance']
                ?? $response['data']['balance']
                ?? $response['balance']
                ?? null;

            if (! is_numeric($balance)) {
                return ['main_balance' => null, 'main_error' => 'Gateway tidak memberi angka saldo main merchant.'];
            }

            return ['main_balance' => (int) round((float) $balance), 'main_error' => null];
        } catch (Throwable $e) {
            Log::channel('monetapay')->warning('Live main-merchant balance failed', ['error' => $e->getMessage()]);

            return ['main_balance' => null, 'main_error' => mb_substr($e->getMessage(), 0, 200)];
        }
    }

    private function gatewayBalance(): ?int
    {
        // A Hub pull must NEVER block on a live gateway call: Monetapay's inquiry
        // carries a 15s timeout, which meets the Hub's own pull timeout and makes
        // the whole summary hang (cURL 28). So read only what is already at hand —
        // the warm balance cache, else the latest reconciliation snapshot — and
        // never trigger a fresh inquiry here. The cache is warmed by callers that
        // can afford the wait (finance dashboard, monetapay:reconcile-fees).
        try {
            // Key it exactly as the writer does — no argument, so the helper
            // resolves the site's configured sub-merchant. Passing
            // `collection_app_id` here (an app id, not a merchant id) named an
            // entry nothing ever wrote, so this always fell through to the
            // snapshot. `current_balance` is the real Monetapay 5.1 field;
            // `balance` is kept only for older cached shapes.
            $cached = Cache::get(MonetapayService::balanceCacheKey());

            $balance = $cached['data']['current_balance']
                ?? $cached['data']['balance']
                ?? $cached['balance']
                ?? null;

            if (is_numeric($balance)) {
                return (int) round((float) $balance);
            }

            return GatewayBalanceSnapshot::latest('captured_at')->value('reported_balance');
        } catch (Throwable) {
            return null;
        }
    }
}
