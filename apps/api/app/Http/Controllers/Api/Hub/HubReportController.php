<?php

namespace App\Http\Controllers\Api\Hub;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Enums\TransactionStatus;
use App\Enums\WithdrawalStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\PlatformMutation;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Services\Payment\MonetapayService;
use App\Support\Wallet\PlatformBalance;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
            'active_subscriptions_count' => (int) ServiceSubscription::query()
                ->where('status', SubscriptionStatus::ACTIVE)
                ->where('ends_at', '>', now())
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

    private function gatewayBalance(): ?int
    {
        try {
            $response = app(MonetapayService::class)->inquiryBalanceCached(
                config('services.monetapay.collection_app_id') ?: null,
            );

            $balance = $response['data']['balance'] ?? $response['balance'] ?? null;

            return is_numeric($balance) ? (int) round((float) $balance) : null;
        } catch (Throwable) {
            return null;
        }
    }
}
