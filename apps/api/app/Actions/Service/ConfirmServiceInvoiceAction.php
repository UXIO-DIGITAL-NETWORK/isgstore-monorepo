<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\DTOs\Service\ConfirmServiceInvoiceDTO;
use App\Enums\ServiceInvoiceStatus;
use App\Models\ServiceInvoice;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * A payment-internal user marks a service bill paid by hand.
 *
 * Bills are normally settled through Monetapay and activated by the webhook
 * (`HandleMonetapayCallbackAction`). This stays as the manual fallback for the
 * cases the gateway cannot cover: a webhook that never arrived, or a client
 * who paid kita outside the gateway entirely.
 *
 * The period itself is opened by `ActivateServiceSubscriptionAction`, shared
 * with the webhook, so both routes to "paid" agree on the stacking rule.
 */
class ConfirmServiceInvoiceAction
{
    public function __construct(
        private readonly ActivateServiceSubscriptionAction $activateAction,
    ) {}

    public function execute(ConfirmServiceInvoiceDTO $dto): ServiceInvoice
    {
        return DB::transaction(function () use ($dto) {
            /** @var ServiceInvoice $invoice */
            $invoice = ServiceInvoice::whereKey($dto->invoiceId)->lockForUpdate()->firstOrFail();

            // Idempotency: a double-click, a retried request, or a webhook that
            // landed first must not open a second period against one payment.
            if ($invoice->status === ServiceInvoiceStatus::PAID) {
                throw new RuntimeException('Invoice ini sudah dikonfirmasi.');
            }

            $invoice->update([
                'status' => ServiceInvoiceStatus::PAID,
                'verified_by' => $dto->verifierId,
                'verified_at' => now(),
                'notes' => $dto->notes ?? $invoice->notes,
            ]);

            $this->activateAction->execute($invoice);

            return $invoice->fresh(['service', 'subscription']);
        });
    }
}
