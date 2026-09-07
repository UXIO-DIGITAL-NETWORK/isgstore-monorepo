<?php

declare(strict_types=1);

namespace App\DTOs\Installation;

use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;

/**
 * Which (client, service) pair an installation belongs to, and — only when it
 * is being created — which period paid for it.
 *
 * Exists because the operator reaches the same installation from two places:
 * a confirmed subscription, and an invoice they are about to confirm.
 */
readonly class InstallationTargetDTO
{
    public function __construct(
        public int $merchantId,
        public int $serviceId,
        /**
         * The period that FIRST paid for this install; null when kita prepares
         * it ahead of confirmation. Audit only — written on create, never used
         * to scope a read.
         */
        public ?int $serviceSubscriptionId = null,
    ) {}

    public static function fromSubscription(ServiceSubscription $subscription): self
    {
        return new self(
            merchantId: (int) $subscription->merchant_id,
            serviceId: (int) $subscription->service_id,
            serviceSubscriptionId: (int) $subscription->id,
        );
    }

    /**
     * Null period on purpose: an installation prepared from an unconfirmed
     * invoice has none yet, and ConfirmServiceInvoiceAction is the only place
     * that knows which period to stamp.
     */
    public static function fromInvoice(ServiceInvoice $invoice): self
    {
        return new self(
            merchantId: (int) $invoice->merchant_id,
            serviceId: (int) $invoice->service_id,
        );
    }
}
