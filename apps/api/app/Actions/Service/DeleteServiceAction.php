<?php

declare(strict_types=1);

namespace App\Actions\Service;

use App\Models\Service;
use RuntimeException;

/**
 * Deleting a service that has been sold would cascade its invoices and
 * subscriptions away with it (the FKs are cascadeOnDelete), taking the billing
 * history with them. Refuse and let kita deactivate instead — the same call
 * PaymentChannelController::destroy already makes.
 */
class DeleteServiceAction
{
    public function execute(Service $service): void
    {
        if ($service->subscriptions()->exists() || $service->invoices()->exists()) {
            throw new RuntimeException(
                'Service ini sudah memiliki invoice atau langganan dan tidak dapat dihapus. Nonaktifkan saja.'
            );
        }

        $service->delete();
    }
}
