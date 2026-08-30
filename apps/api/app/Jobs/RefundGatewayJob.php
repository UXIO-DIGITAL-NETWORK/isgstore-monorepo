<?php

namespace App\Jobs;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RETIRED — kept alive for one release only, then delete this file.
 *
 * Automatic gateway refunds are gone. A failed order now opens a
 * `refund_requests` row instead: a member is credited to their wallet inline,
 * a guest is queued for a manual transfer on the admin refund page. Nothing
 * dispatches this job any more.
 *
 * It still exists because a job serialized into the `jobs` table before the
 * deploy would fatal on an unresolvable class when a worker picked it up, and
 * poison `failed_jobs` with something nobody can replay. Draining as a logged
 * no-op costs two lines and one release.
 *
 * The manual gateway refund tool (`POST /v1/monetapay/refund`) is unaffected —
 * it calls MonetapayService directly and is deliberately outside any automatic
 * path.
 */
class RefundGatewayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** No retries: there is nothing to retry. */
    public int $tries = 1;

    public function __construct(public Payment $payment) {}

    public function handle(): void
    {
        Log::channel('monetapay')->warning(
            'RefundGatewayJob is retired and did nothing — a queued job predates the refund rewrite. '
            ."Check refund_requests for payment {$this->payment->reference_id}."
        );
    }
}
