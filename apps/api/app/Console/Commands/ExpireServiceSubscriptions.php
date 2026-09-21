<?php

namespace App\Console\Commands;

use App\Enums\ServiceInvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Jobs\PushServiceOrderToHubJob;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use Illuminate\Console\Command;

/**
 * Closes the two service-billing states that go stale purely because a date
 * passed and nobody acted.
 *
 *   1. ACTIVE subscriptions past their `ends_at` — without this a client keeps
 *      showing as subscribed forever and the "Active until" card lies.
 *   2. UNPAID invoices past their `due_at` — an abandoned request would
 *      otherwise block the client from ordering the same service again, since
 *      SubscribeToServiceAction refuses a second open invoice.
 *
 * WAITING_CONFIRMATION is deliberately never swept: that state is waiting on
 * kita, and expiring it would penalise the client for kita's own backlog.
 */
class ExpireServiceSubscriptions extends Command
{
    protected $signature = 'services:expire {--dry-run : Report what would change without writing}';

    protected $description = 'Expire lapsed service subscriptions and overdue unpaid service invoices';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $lapsed = ServiceSubscription::query()
            ->where('status', SubscriptionStatus::ACTIVE)
            // Explicit, like ExpireMemberships: a NULL window is a lifetime
            // subscription and must never be swept. `<= now()` already excludes
            // NULL in SQL, and saying so here is what keeps that true when
            // somebody edits the comparison.
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', now())
            ->get();

        $expiredSubscriptions = 0;

        foreach ($lapsed as $subscription) {
            // A client who renewed holds a later row for the same service. This
            // one still closes, but it is not a lapse — say so, so the log does
            // not read as a client losing access they in fact still have.
            $stillCovered = ServiceSubscription::query()
                ->where('merchant_id', $subscription->merchant_id)
                ->where('service_id', $subscription->service_id)
                ->where('status', SubscriptionStatus::ACTIVE)
                ->whereKeyNot($subscription->id)
                ->where('ends_at', '>', now())
                ->exists();

            if ($dryRun) {
                $this->line(sprintf(
                    '  subscription #%d — %s',
                    $subscription->id,
                    $stillCovered ? 'closing row only (renewed)' : 'expiring',
                ));

                continue;
            }

            $subscription->update(['status' => SubscriptionStatus::EXPIRED]);
            $expiredSubscriptions++;
        }

        // A bill a CLIENT raised and abandoned should close — an unpaid request
        // left open forever is clutter, and they can always ask again.
        //
        // A bill KITA issued on a schedule must not. `service_invoices` has a
        // unique `hub_item_key`, so once a plan invoice is expired that period
        // can never be re-issued: the client would simply have no way to pay for
        // a service they still hold, and nothing anywhere would report a
        // problem. The plan sync reopens rows this sweep closed before the
        // exclusion existed; see ApplyHubPlanAction::reopenIfStranded().
        $overdue = ServiceInvoice::query()
            ->where('status', ServiceInvoiceStatus::UNPAID)
            ->where('source', '!=', 'hub_plan')
            ->whereNotNull('due_at')
            // Inclusive of the due DAY, the same rule the payment guard uses: a
            // bill due today is still payable today, so it closes from the day
            // after. `<= now()` closed it at 00:00 on its own due date — and
            // this sweep runs at 00:20, so a full day of the client's window was
            // gone before they woke up.
            ->where('due_at', '<', now()->startOfDay())
            ->get();

        $expiredInvoices = 0;

        foreach ($overdue as $invoice) {
            if ($dryRun) {
                $this->line("  invoice {$invoice->invoice_number} — expiring");

                continue;
            }

            $invoice->update(['status' => ServiceInvoiceStatus::EXPIRED]);
            $expiredInvoices++;

            // Keep the Hub's order queue in step: this order will never be paid.
            PushServiceOrderToHubJob::maybeDispatch($invoice);
        }

        $this->info($dryRun
            ? sprintf('Dry run: %d subscription(s) and %d invoice(s) would be expired.', $lapsed->count(), $overdue->count())
            : sprintf('Expired %d subscription(s) and %d invoice(s).', $expiredSubscriptions, $expiredInvoices));

        return self::SUCCESS;
    }
}
