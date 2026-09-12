<?php

namespace App\Console\Commands;

use App\Actions\Notification\NotifyPaymentInternalAction;
use App\Actions\Notification\NotifyUserAction;
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

    /** Days-before-expiry marks at which a reminder is raised, widest first. */
    private const THRESHOLDS = [7, 3];

    public function handle(NotifyPaymentInternalAction $notifier, NotifyUserAction $notifyUser): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $raised = 0;

        foreach (self::THRESHOLDS as $i => $threshold) {
            // The tighter mark below this one, or 0 at the last. Only the client
            // half uses it — see below.
            $floorDays = self::THRESHOLDS[$i + 1] ?? 0;

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

                // The client owning the subscription hears about it too, in
                // their own words — it is their site that lapses, and until now
                // the only people told were the ones who do not pay the bill.
                // Addressed to the merchant rather than fanned across the
                // `payment-admin` role, which would tell every client about
                // every other client's billing.
                //
                // The windows all start at `now`, so a subscription two days out
                // matches H-7 and H-3 in the same run. That is deliberate for the
                // internal team — two rows, each keyed, pinned by
                // PaymentPage\NotificationTest — but a client should not be sent
                // two reminders at once about one bill, the wider of which
                // overstates how long they have. Only the tightest mark that
                // matches raises the client's row, and the day count is the real
                // one rather than the mark's own name.
                $daysLeft = (int) ceil(now()->diffInDays($subscription->ends_at, absolute: true));
                $tighterMarkAlsoMatches = $floorDays > 0 && $subscription->ends_at <= now()->addDays($floorDays);

                if ($subscription->merchant_id !== null && ! $tighterMarkAlsoMatches) {
                    $notifyUser->execute(
                        userId: $subscription->merchant_id,
                        type: 'subscription_expiring',
                        title: 'Langganan Anda akan habis',
                        message: "Paket {$serviceName} akan habis dalam {$daysLeft} hari — {$endsAt}. Perpanjang sebelum layanan berhenti.",
                        data: [
                            'subscription_id' => $subscription->id,
                            'service_id' => $subscription->service_id,
                            'days_left' => $daysLeft,
                            'ends_at' => $subscription->ends_at?->toIso8601String(),
                        ],
                        // Its own namespace: the merchant's row and the internal
                        // team's row are different messages about one fact, and
                        // must not collapse into each other.
                        dedupeKey: "subexp-merchant:{$subscription->id}:{$threshold}",
                    );
                }

                $raised++;
            }
        }

        $this->info($dryRun
            ? 'Dry run: reminders listed above would be raised.'
            : "Raised {$raised} expiring-subscription reminder(s) for payment-internal users and the owning clients.");

        return self::SUCCESS;
    }
}
