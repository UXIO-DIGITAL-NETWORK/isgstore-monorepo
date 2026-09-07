<?php

namespace App\Console\Commands;

use App\Actions\Financial\ReconcileGatewayFeesAction;
use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;

/**
 * Audits gateway-fee bookkeeping against the Monetapay contract and reconciles
 * the reported balance against our ledger. Prints a per-check summary and, when
 * anything is off, alerts the internal team on Discord. Scheduled daily.
 */
class ReconcileGatewayFeesCommand extends Command
{
    protected $signature = 'monetapay:reconcile-fees
        {--window=7 : Days of settled payments to re-check for frozen-fee drift}';

    protected $description = 'Audit channel gateway fees vs the Monetapay contract and reconcile the balance.';

    public function __construct(
        private readonly ReconcileGatewayFeesAction $action,
        private readonly DiscordWebhookService $discord,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $window = max(1, (int) $this->option('window'));
        $report = $this->action->execute($window);

        $alerts = [];

        // (a) config vs contract
        $config = $report['config_audit'];
        if ($config['findings'] === []) {
            $this->info("Config audit: {$config['checked']} active channel(s), all match the contract.");
        } else {
            $this->warn('Config audit: '.count($config['findings']).' channel(s) diverge from the contract:');
            $this->table(
                ['Channel', 'Issue', 'Configured', 'Expected'],
                array_map(fn ($f) => [
                    $f['channel_code'],
                    $f['issue'],
                    "{$f['configured']['flat']}+{$f['configured']['percent']}%",
                    $f['expected'] ? "{$f['expected']['flat']}+{$f['expected']['percent']}%" : '—',
                ], $config['findings'])
            );
            $names = implode(', ', array_map(fn ($f) => "{$f['channel_code']} ({$f['issue']})", $config['findings']));
            $alerts[] = "Config channel menyimpang dari kontrak: {$names}.";
        }

        // (b) frozen gateway_fee on settled payments
        $frozen = $report['frozen_fee_audit'];
        $this->info("Frozen-fee audit: checked {$frozen['checked']} payment(s) over {$window}d — "
            ."{$frozen['mismatch_count']} mismatch, {$frozen['unlisted_count']} unlisted.");
        if ($frozen['mismatch_count'] > 0 || $frozen['unlisted_count'] > 0) {
            $this->table(
                ['Reference', 'Channel', 'Gross', 'Stored', 'Expected', 'Diff'],
                array_map(fn ($s) => [
                    $s['reference_id'],
                    $s['channel_code'],
                    number_format($s['gross_amount']),
                    number_format($s['stored']),
                    $s['expected'] === null ? '—' : number_format($s['expected']),
                    $s['diff'] === null ? '—' : number_format($s['diff']),
                ], $frozen['samples'])
            );
            if ($frozen['mismatch_count'] > 0) {
                $alerts[] = "{$frozen['mismatch_count']} pembayaran punya gateway_fee beku ≠ kontrak (window {$window}h).";
            }
        }

        // (c) balance reconciliation
        $bal = $report['balance_reconciliation'];
        if (($bal['reported_balance'] ?? null) === null) {
            $this->warn('Balance reconciliation: Monetapay inquiry unavailable — skipped this run.');
        } elseif (! empty($bal['baseline'])) {
            $this->info('Balance reconciliation: baseline snapshot recorded at Rp '
                .number_format($bal['reported_balance']).' (no prior run to compare).');
        } else {
            $line = 'Balance reconciliation: reported Δ Rp '.number_format($bal['reported_delta'])
                .' vs expected Δ Rp '.number_format($bal['expected_movement'])
                .' → drift Rp '.number_format($bal['delta']);
            if ($bal['within_tolerance']) {
                $this->info($line.' (within tolerance).');
            } else {
                $this->warn($line.' (OUT OF TOLERANCE).');
                $alerts[] = 'Saldo Monetapay menyimpang dari buku sebesar Rp '.number_format($bal['delta'])
                    .' — cek fee config / top-up manual / perubahan tarif.';
            }
        }

        if ($alerts !== []) {
            $this->discord->sendAlert("Rekonsiliasi fee gateway menemukan masalah:\n• ".implode("\n• ", $alerts));
        }

        return self::SUCCESS;
    }
}
