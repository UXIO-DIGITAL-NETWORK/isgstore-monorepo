<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\DiscordWebhookService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Is the queue worker actually consuming?
 *
 * A dead worker is the most damaging silent failure this app has: the customer
 * pays, ProcessUxiolabsTopup never runs, and the order simply never reaches the
 * supplier. Nothing errors — the job just sits in `jobs` forever. Config sync,
 * status polling and merchant payouts stop with it.
 *
 * Deploy-time checks cannot catch this, because a worker that was healthy at
 * deploy can die an hour later. This runs on the SCHEDULER, which is a separate
 * process from supervisor, so it can still speak when the worker cannot.
 *
 * The signal is deliberately "due and untouched", not "queue is non-empty":
 * PollUxiolabsStatusJob re-schedules itself minutes into the future by design,
 * so a healthy queue is often far from empty. Only a job whose `available_at`
 * passed a while ago proves nobody is picking work up.
 */
class CheckQueueHealth extends Command
{
    protected $signature = 'queue:health
                            {--overdue-minutes=5 : A due job untouched this long means nobody is consuming}';

    protected $description = 'Alert when the queue worker has stopped consuming jobs';

    public function handle(DiscordWebhookService $discord): int
    {
        // Only meaningful for a driver that parks work in a table. Under `sync`
        // every job runs inline, so there is no worker to be dead.
        if (config('queue.default') !== 'database') {
            $this->info('Queue driver is not `database` — nothing to check.');

            return self::SUCCESS;
        }

        $threshold = now()->subMinutes(max(1, (int) $this->option('overdue-minutes')));

        $stuck = DB::table('jobs')
            ->where('available_at', '<=', $threshold->getTimestamp())
            ->count();

        if ($stuck === 0) {
            $this->info('Queue is being consumed.');

            return self::SUCCESS;
        }

        $oldest = DB::table('jobs')
            ->where('available_at', '<=', $threshold->getTimestamp())
            ->min('available_at');

        $waitingMinutes = $oldest ? (int) round((time() - (int) $oldest) / 60) : 0;

        $this->error("{$stuck} job(s) overdue; oldest waiting {$waitingMinutes} minutes.");

        $discord->sendAlert(
            "⚠️ Queue worker tampaknya berhenti: {$stuck} job sudah lewat jadwal, "
            ."yang terlama menunggu {$waitingMinutes} menit.\n"
            .'Akibatnya order top-up yang sudah dibayar TIDAK dikirim ke supplier. '
            .'Cek `sudo supervisorctl status` di server situs.'
        );

        return self::SUCCESS;
    }
}
