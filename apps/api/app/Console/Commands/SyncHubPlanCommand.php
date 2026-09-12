<?php

namespace App\Console\Commands;

use App\Actions\Hub\ApplyHubPlanAction;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pulls the Hub's service plan and issues this site's own bills from it.
 *
 * Fifteen minutes, not five: this issues invoices, and a fifteen-minute lag on a
 * bill that falls due in a fortnight is nothing. The five-minute slot stays
 * reserved for the licence — the one pull that decides whether the site serves.
 *
 * Gated by HUB_MANAGED_PLAN, off by default, so the cutover happens one site at
 * a time and can be stopped instantly. A hand-run ignores the flag, the same way
 * `hub:sync-catalog` does, so a deployment can be verified before it is armed.
 */
class SyncHubPlanCommand extends Command
{
    protected $signature = 'hub:sync-plan';

    protected $description = "Pull the Hub's service plan and issue the invoices it calls for";

    public function handle(ApplyHubPlanAction $action): int
    {
        try {
            $report = $action->execute();
        } catch (Throwable $e) {
            // An unreachable Hub changes nothing: no new bills, and every bill
            // already issued keeps working. Failing loudly beats issuing
            // something from a half-read payload.
            $this->error("Hub plan sync failed: {$e->getMessage()}");
            Log::error('hub:sync-plan failed', ['error' => $e->getMessage()]);

            return self::FAILURE;
        }

        $this->info(sprintf(
            'Paket selaras: %d tagihan baru, %d dibuka kembali, %d prabayar dicatat, %d dilewati.',
            $report['issued'],
            $report['reopened'],
            $report['prepaid'],
            $report['skipped'],
        ));

        return self::SUCCESS;
    }
}
