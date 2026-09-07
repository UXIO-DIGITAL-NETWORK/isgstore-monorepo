<?php

namespace App\Models\Concerns;

use App\Models\ServiceInstallation;

/**
 * Finds the installation covering this row's (merchant, service) pair.
 *
 * Both `ServiceSubscription` and `ServiceInvoice` carry that pair, and both
 * need the lookup — the operator reaches an installation from whichever is in
 * hand. It is deliberately NOT an Eloquent relation: the join is two columns
 * because installations are per service account rather than per paid period,
 * and `hasOne` cannot express that. Naming it `resolve*` keeps it from being
 * reached for with `with()` by mistake.
 */
trait ResolvesServiceInstallation
{
    public function resolveInstallation(): ?ServiceInstallation
    {
        return ServiceInstallation::query()
            ->where('merchant_id', $this->merchant_id)
            ->where('service_id', $this->service_id)
            ->first();
    }
}
