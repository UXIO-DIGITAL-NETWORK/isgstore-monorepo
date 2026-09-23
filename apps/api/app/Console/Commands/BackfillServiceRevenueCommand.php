<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\PlatformMutation;
use App\Models\ServiceInvoice;
use App\Models\ServiceInvoicePayment;
use App\Support\Ledger\ServiceRevenueLedger;
use Illuminate\Console\Command;

/**
 * Books service revenue for payments the recovery sweep settled before it knew
 * to book it.
 *
 * `service-payments:sync-expired` marked the attempt PAID, marked its bills PAID
 * and opened the subscription — but credited no revenue. The client got their
 * service and the bill reads PAID, so the loss is invisible on the row: nothing
 * on a settled invoice says whether the money reached the ledger. The only way
 * back is to look for the ABSENCE of the credit, which is what this does.
 *
 * Deliberately opt-in, never scheduled — it moves real money onto kita's
 * withdrawable platform balance, so it is run by a person who has looked at the
 * dry run first. Its sibling is `payment:settle-backfill`, which covers the same
 * kind of gap on the checkout side.
 *
 * It books money and nothing else: the invoices, subscriptions and licence terms
 * left behind by the sweep are already correct.
 */
class BackfillServiceRevenueCommand extends Command
{
    protected $signature = 'service-revenue:backfill
        {--dry-run : Report what would be credited without writing to the database}';

    protected $description = 'Book service revenue for paid service payments that were recovered without it.';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if ($dry) {
            $this->info('[DRY RUN] No database writes will occur.');
        }

        /*
         * The loss signature: an attempt that reached PAID without a
         * `service_revenue` mutation carrying its reference.
         *
         * Both paths that book correctly use a reference this finds — the
         * webhook credits the attempt's `reference_id`, and the manual confirm
         * credits the invoice's `invoice_number` (so its attempt, if any, was
         * never PAID). An attempt that the webhook settled therefore already
         * matches, and is excluded here.
         */
        $candidates = ServiceInvoicePayment::with('items')
            ->where('status', 'PAID')
            ->whereNotExists(fn ($query) => $query
                ->from('platform_mutations')
                ->where('type', 'service_revenue')
                ->whereColumn('reference', 'service_invoice_payments.reference_id'))
            ->get();

        if ($candidates->isEmpty()) {
            $this->info('Nothing to backfill — every paid service payment has its revenue booked.');

            return self::SUCCESS;
        }

        $this->info("Found {$candidates->count()} paid service payment(s) with no revenue booked...");

        $counts = ['credited' => 0, 'ambiguous' => 0, 'empty' => 0];

        foreach ($candidates as $attempt) {
            $counts[$this->backfill($attempt, $dry)]++;
        }

        $this->table(
            ['Outcome', 'Count'],
            collect($counts)->map(fn ($v, $k) => [ucfirst($k), $v])->values()->toArray(),
        );

        return self::SUCCESS;
    }

    private function backfill(ServiceInvoicePayment $attempt, bool $dry): string
    {
        $ref = $attempt->reference_id;

        /*
         * One legitimate state reaches the query above without being a loss, and
         * crediting it would double-book: the webhook settled an attempt whose
         * bills had ALREADY been confirmed by hand, so it credited zero — a
         * no-op that leaves no attempt-level mutation behind, while the bills
         * themselves were credited under their own invoice numbers.
         *
         * Anything in that shape is reported rather than guessed at: a partial
         * credit is a bookkeeping question for a person, not for a backfill.
         */
        $invoiceNumbers = ServiceInvoice::whereIn('id', $attempt->items->pluck('service_invoice_id'))
            ->pluck('invoice_number');

        $alreadyCredited = PlatformMutation::query()
            ->where('type', 'service_revenue')
            ->whereIn('reference', $invoiceNumbers)
            ->exists();

        if ($alreadyCredited) {
            $this->warn("  SKIP  {$ref} — its bills were already credited under their invoice numbers.");

            return 'ambiguous';
        }

        // The attempt's own bills, which is the same unit the webhook credits
        // (and never the attempt's `total`, which includes the channel fee).
        $amount = (int) $attempt->items->sum('amount');

        if ($amount <= 0) {
            $this->warn("  SKIP  {$ref} — the attempt covers no bill amount.");

            return 'empty';
        }

        $this->line(sprintf('  %s  %s (Rp %s)', $dry ? 'WOULD CREDIT' : 'CREDITED', $ref, number_format($amount)));

        if ($dry) {
            return 'credited';
        }

        ServiceRevenueLedger::credit(
            amount: $amount,
            reference: $ref,
            description: 'Layanan '.collect($invoiceNumbers)->implode(', ')." ({$ref}) — backfill pendapatan",
        );

        return 'credited';
    }
}
