<?php

namespace App\Http\Resources\Api\Service;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

/**
 * The catalogue entry as the checkout page needs it: the service itself plus
 * the period confirmation would actually open, and whether an unpaid bill is
 * already in the way.
 *
 * The projected window is computed on the server precisely because it mirrors
 * ConfirmServiceInvoiceAction's stacking rule — a client renewing early keeps
 * the days they already paid for, and the frontend must not re-derive that.
 *
 * @mixin Service
 */
class ServiceCheckoutResource extends JsonResource
{
    public function __construct(
        Service $resource,
        private readonly ?Carbon $currentPeriodEndsAt = null,
        private readonly ?int $openInvoiceId = null,
    ) {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        $startsAt = $this->currentPeriodEndsAt && $this->currentPeriodEndsAt->isFuture()
            ? $this->currentPeriodEndsAt->copy()
            : now();

        return array_merge((new ServiceResource($this->resource))->toArray($request), [
            'current_period_ends_at' => $this->currentPeriodEndsAt?->toIso8601String(),
            'projected_starts_at' => $startsAt->toIso8601String(),
            'projected_ends_at' => $startsAt->copy()->addDays((int) $this->duration_days)->toIso8601String(),
            // SubscribeToServiceAction refuses a second open invoice with a 422.
            // Surfacing it here lets the page disable Confirm and link to the
            // existing bill instead of firing a request that always fails.
            'has_open_invoice' => $this->openInvoiceId !== null,
            'open_invoice_id' => $this->openInvoiceId,
        ]);
    }
}
