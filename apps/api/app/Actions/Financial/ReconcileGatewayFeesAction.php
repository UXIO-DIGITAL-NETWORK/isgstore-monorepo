<?php

declare(strict_types=1);

namespace App\Actions\Financial;

use App\Enums\PaymentStatus;
use App\Enums\WithdrawalStatus;
use App\Models\GatewayBalanceSnapshot;
use App\Models\Payment;
use App\Models\PaymentChannel;
use App\Models\Withdrawal;
use App\Support\Payment\MonetapayContractFees;
use Carbon\CarbonImmutable;

/**
 * Reconciles kita's gateway-fee bookkeeping against the Monetapay contract and
 * against Monetapay's real balance. Three independent checks, one report:
 *
 *   (a) config audit   — each active channel's gateway fee vs the contract table.
 *   (b) frozen-fee audit — each settled payment's stored gateway_fee vs a fresh
 *       recompute from the contract (catches rows charged under a wrong config).
 *   (c) balance reconciliation — the delta between this run's reported Monetapay
 *       balance and what our ledger predicts since the previous snapshot.
 *
 * All read-only except (c), which appends one GatewayBalanceSnapshot per run.
 */
class ReconcileGatewayFeesAction
{
    /** Balance drift under this (Rp) is noise — rounding, timing at window edges. */
    private const BALANCE_TOLERANCE = 5000;

    /** Cap the mismatch rows carried in the report; the count is always exact. */
    private const SAMPLE_LIMIT = 50;

    public function __construct(private readonly GetPaymentGatewayBalancesAction $balances) {}

    /**
     * @return array{config_audit:array, frozen_fee_audit:array, balance_reconciliation:array}
     */
    public function execute(int $windowDays = 7): array
    {
        $now = CarbonImmutable::now();
        $windowStart = $now->subDays($windowDays);

        return [
            'config_audit' => $this->auditConfig(),
            'frozen_fee_audit' => $this->auditFrozenFees($windowStart, $now),
            'balance_reconciliation' => $this->reconcileBalance($now),
        ];
    }

    /**
     * (a) Every active channel compared to the Monetapay contract. An unlisted
     * channel (bca_va) and a rate that no longer matches both surface here.
     */
    private function auditConfig(): array
    {
        $findings = [];

        foreach (PaymentChannel::where('is_active', true)->orderBy('channel_code')->get() as $c) {
            if (! MonetapayContractFees::has($c->channel_code)) {
                $findings[] = [
                    'channel_code' => $c->channel_code,
                    'name' => $c->name,
                    'issue' => 'unlisted',
                    'configured' => ['flat' => (int) $c->gateway_fee_flat, 'percent' => (float) $c->gateway_fee_percent],
                    'expected' => null,
                ];

                continue;
            }

            $expectedFlat = (int) MonetapayContractFees::flatFor($c->channel_code);
            $expectedPercent = (float) MonetapayContractFees::percentFor($c->channel_code);

            $mismatch = (int) $c->gateway_fee_flat !== $expectedFlat
                || abs((float) $c->gateway_fee_percent - $expectedPercent) > 0.001;

            if ($mismatch) {
                $findings[] = [
                    'channel_code' => $c->channel_code,
                    'name' => $c->name,
                    'issue' => 'mismatch',
                    'configured' => ['flat' => (int) $c->gateway_fee_flat, 'percent' => (float) $c->gateway_fee_percent],
                    'expected' => ['flat' => $expectedFlat, 'percent' => $expectedPercent],
                ];
            }
        }

        return ['checked' => PaymentChannel::where('is_active', true)->count(), 'findings' => $findings];
    }

    /**
     * (b) Settled payments in the window whose frozen gateway_fee no longer
     * equals a fresh contract recompute. `unlisted` rows are reported separately
     * since there is no contract figure to compare against.
     */
    private function auditFrozenFees(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $checked = 0;
        $mismatchCount = 0;
        $unlistedCount = 0;
        $samples = [];

        Payment::with('paymentChannel')
            ->where('status', PaymentStatus::SUCCESS->value)
            ->whereBetween('paid_at', [$from, $to])
            ->chunkById(500, function ($payments) use (&$checked, &$mismatchCount, &$unlistedCount, &$samples) {
                foreach ($payments as $payment) {
                    $checked++;
                    $code = $payment->paymentChannel?->channel_code ?? '';
                    $stored = (int) $payment->gateway_fee;

                    if (! MonetapayContractFees::has($code)) {
                        $unlistedCount++;
                        if (count($samples) < self::SAMPLE_LIMIT) {
                            $samples[] = [
                                'reference_id' => $payment->reference_id,
                                'channel_code' => $code,
                                'gross_amount' => (int) $payment->gross_amount,
                                'stored' => $stored,
                                'expected' => null,
                                'diff' => null,
                            ];
                        }

                        continue;
                    }

                    $expected = MonetapayContractFees::expectedGatewayFee($code, (int) $payment->gross_amount);
                    if ($expected !== $stored) {
                        $mismatchCount++;
                        if (count($samples) < self::SAMPLE_LIMIT) {
                            $samples[] = [
                                'reference_id' => $payment->reference_id,
                                'channel_code' => $code,
                                'gross_amount' => (int) $payment->gross_amount,
                                'stored' => $stored,
                                'expected' => $expected,
                                'diff' => $stored - $expected,
                            ];
                        }
                    }
                }
            });

        return [
            'checked' => $checked,
            'mismatch_count' => $mismatchCount,
            'unlisted_count' => $unlistedCount,
            'samples' => $samples,
        ];
    }

    /**
     * (c) Reconcile the reported Monetapay balance against our books, comparing
     * the DELTA since the previous snapshot (the absolute baseline is invisible).
     * The first ever run is a baseline: it records the reported balance and
     * asserts nothing.
     *
     * Predicted movement since the previous snapshot:
     *   + Σ(gross − gateway_fee)  collections that landed (Direct Deduction net)
     *   − Σ(gross)                refunds paid back out
     *   − Σ(nett + disbursement)  payouts plus Monetapay's flat disbursement fee
     *
     * Not modelled (will read as drift, hence the tolerance): manual top-ups to
     * the Monetapay account, and any Monetapay charge outside the contract table.
     */
    private function reconcileBalance(CarbonImmutable $now): array
    {
        $reported = $this->reportedBalance();
        if ($reported === null) {
            return ['reported_balance' => null, 'error' => 'inquiry_failed'];
        }

        /** @var GatewayBalanceSnapshot|null $prev */
        $prev = GatewayBalanceSnapshot::latest('captured_at')->first();

        if ($prev === null) {
            $snapshot = GatewayBalanceSnapshot::create([
                'captured_at' => $now,
                'reported_balance' => $reported,
                'expected_balance' => $reported,
                'delta' => 0,
                'meta' => ['baseline' => true],
            ]);

            return [
                'reported_balance' => $reported,
                'baseline' => true,
                'expected_balance' => $reported,
                'delta' => 0,
                'within_tolerance' => true,
                'snapshot_id' => $snapshot->id,
            ];
        }

        $since = CarbonImmutable::parse($prev->captured_at);
        $components = $this->predictedMovement($since, $now);
        $expectedMovement = $components['collections_net'] - $components['refunds'] - $components['payouts_total'];

        $expectedBalance = (int) $prev->reported_balance + $expectedMovement;
        $reportedDelta = $reported - (int) $prev->reported_balance;
        $drift = $reported - $expectedBalance; // == reportedDelta - expectedMovement
        $withinTolerance = abs($drift) <= self::BALANCE_TOLERANCE;

        $snapshot = GatewayBalanceSnapshot::create([
            'captured_at' => $now,
            'reported_balance' => $reported,
            'expected_balance' => $expectedBalance,
            'delta' => $drift,
            'meta' => [
                'since' => $since->toIso8601String(),
                'previous_reported' => (int) $prev->reported_balance,
                'expected_movement' => $expectedMovement,
                'reported_delta' => $reportedDelta,
                'components' => $components,
            ],
        ]);

        return [
            'reported_balance' => $reported,
            'baseline' => false,
            'previous_reported' => (int) $prev->reported_balance,
            'expected_movement' => $expectedMovement,
            'reported_delta' => $reportedDelta,
            'expected_balance' => $expectedBalance,
            'delta' => $drift,
            'within_tolerance' => $withinTolerance,
            'components' => $components,
            'snapshot_id' => $snapshot->id,
        ];
    }

    /** @return array<string,int> */
    private function predictedMovement(CarbonImmutable $since, CarbonImmutable $now): array
    {
        // Money in, net of Monetapay's cut. REFUNDED rows are included here (they
        // once landed) and backed out below, so a pay+refund in one window nets
        // to just the retained fee.
        $collections = Payment::whereIn('status', [PaymentStatus::SUCCESS->value, PaymentStatus::REFUNDED->value])
            ->whereBetween('paid_at', [$since, $now])
            ->selectRaw('COALESCE(SUM(gross_amount),0) AS gross, COALESCE(SUM(gateway_fee),0) AS fee')
            ->first();
        $collectionsGross = (int) ($collections->gross ?? 0);
        $collectionsFee = (int) ($collections->fee ?? 0);

        $refunds = (int) Payment::where('status', PaymentStatus::REFUNDED->value)
            ->whereBetween('updated_at', [$since, $now])
            ->sum('gross_amount');

        // Payouts: the nett to the merchant plus Monetapay's flat disbursement fee.
        $settled = Withdrawal::where('status', WithdrawalStatus::SETTLED->value)
            ->whereBetween('updated_at', [$since, $now])
            ->selectRaw('COALESCE(SUM(nett),0) AS nett, COUNT(*) AS n')
            ->first();
        $payoutNett = (int) ($settled->nett ?? 0);
        $payoutFee = (int) ($settled->n ?? 0) * MonetapayContractFees::DISBURSEMENT_FEE;

        return [
            'collections_gross' => $collectionsGross,
            'collections_fee' => $collectionsFee,
            'collections_net' => $collectionsGross - $collectionsFee,
            'refunds' => $refunds,
            'payouts_nett' => $payoutNett,
            'payouts_fee' => $payoutFee,
            'payouts_total' => $payoutNett + $payoutFee,
        ];
    }

    /** The active Monetapay balance, or null when the inquiry is unavailable. */
    private function reportedBalance(): ?int
    {
        $row = $this->balances->execute()[0] ?? null;
        $value = $row['active_balance'] ?? null;

        return $value === null ? null : (int) round((float) $value);
    }
}
