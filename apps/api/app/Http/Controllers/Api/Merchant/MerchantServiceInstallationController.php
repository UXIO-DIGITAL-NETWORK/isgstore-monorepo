<?php

namespace App\Http\Controllers\Api\Merchant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\Service\ServiceInstallationResource;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceSubscription;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

/**
 * The client's read-only view of its own installation: how far along kita is,
 * and the credentials handed over so far.
 *
 * The `payment-admin` middleware proves *a* client is calling, not *which* —
 * every method re-checks ownership itself, answering 404 rather than 403 so
 * another client's ids cannot be probed.
 */
class MerchantServiceInstallationController extends Controller
{
    use ApiResponse;

    public function show(Request $request, ServiceSubscription $serviceSubscription)
    {
        abort_unless($serviceSubscription->merchant_id === $request->user()->id, 404);

        $installation = $serviceSubscription->resolveInstallation();

        if (! $installation) {
            return $this->successResponse(null, 'No installation yet');
        }

        return $this->successResponse(
            new ServiceInstallationResource(
                $installation->load(['service:id,code,name', 'steps.completedBy:id,name', 'details'])
            ),
            'Installation retrieved successfully'
        );
    }

    /** Plaintext leaves the server only here. See the internal twin for why POST. */
    public function reveal(Request $request, ServiceInstallationDetail $serviceInstallationDetail)
    {
        $merchantId = $serviceInstallationDetail->installation?->merchant_id;

        abort_unless($merchantId === $request->user()->id, 404);

        return $this->successResponse([
            'id' => $serviceInstallationDetail->id,
            'value' => $serviceInstallationDetail->value,
        ], 'Value revealed')->header('Cache-Control', 'no-store');
    }
}
