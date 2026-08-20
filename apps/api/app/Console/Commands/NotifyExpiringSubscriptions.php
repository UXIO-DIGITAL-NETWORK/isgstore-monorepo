<?php

namespace App\Console\Commands;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\Enums\SubscriptionStatus;
use App\Models\ServiceSubscription;
use Illuminate\Console\Command;

/**
 * Reminds the internal team that a client's service package is running out, so
 * kita can nudge a renewal before access lapses.
 *
 * Two reminders per subscription: H-7 and H-3. Each is keyed
 * `subexp:{id}:{threshold}` so the daily run fires it exactly once — a package
 * seven days out raises its H-7 notification the first day it enters the window
 * and never again, then its H-3 notification when it crosses that line. A
 * subscription created already inside three days simply raises both at once.
 *
 * Read-only over the subscriptions themselves: expiring the lapsed ones is
 * services:expire's job, not this one's.
 */
class NotifyExpiringSubscriptions extends Command
{
    protected $signature = 'subscriptions:notify-expiring {--dry-run : Report what would notify without writing}';

    protected $description = 'Notify the internal team of service subscriptions expiring at H-7 and H-3';

    /** Days-before-expiry marks at which a reminder is raised. */
    private const THRESHOLDS = [7, 3];

    public function handle(NotifyPaymentInternalAction $notifier): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $raised = 0;

        foreach (self::THRESHOLDS as $threshold) {
            $due = ServiceSubscription::query()
                ->with(['merchant', 'service'])
                ->where('status', SubscriptionStatus::ACTIVE)
                ->whereBetween('ends_at', [now(), now()->addDays($threshold)])
                ->get();

            foreach ($due as $subscription) {
                $merchantName = $subscription->merchant?->name ?? "Client #{$subscription->merchant_id}";
                $serviceName = $subscription->service?->name ?? "Layanan #{$subscription->service_id}";
                $endsAt = $subscription->ends_at?->translatedFormat('d M Y');

                if ($dryRun) {
                    $this->line("  H-{$threshold} subscription #{$subscription->id} — {$serviceName} ({$merchantName}) ends {$endsAt}");

                    continue;
                }

                $notifier->execute(
                    type: 'subscription_expiring',
                    title: 'Paket akan habis',
                    message: "Paket {$serviceName} milik {$merchantName} akan habis dalam {$threshold} hari — {$endsAt}",
                    data: [
                        'subscription_id' => $subscription->id,
                        'merchant_id' => $subscription->merchant_id,
                        'service_id' => $subscription->service_id,
                        'days_left' => $threshold,
                        'ends_at' => $subscription->ends_at?->toIso8601String(),
                    ],
                    dedupeKey: "subexp:{$subscription->id}:{$threshold}",
                );

                $raised++;
            }
        }

        $this->info($dryRun
            ? 'Dry run: reminders listed above would be raised.'
            : "Raised {$raised} expiring-subscription reminder(s) across payment-internal users.");

        return self::SUCCESS;
    }
}
