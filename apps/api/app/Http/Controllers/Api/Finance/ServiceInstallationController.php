<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Installation\UpsertServiceInstallationAction;
use App\DTOs\Installation\InstallationTargetDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Installation\UpsertServiceInstallationRequest;
use App\Http\Resources\Api\Service\ServiceInstallationResource;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceInvoice;
use App\Models\ServiceSubscription;
use App\Traits\ApiResponse;

/**
 * Kita schedules the installation of a client's service and hands over its
 * credentials.
 *
 * Reachable by two ids because the operator reaches it from two places: a
 * confirmed subscription, and an invoice they are about to confirm — preparing
 * the install BEFORE confirming is the point, so the client's first view of a
 * paid service is a scheduled one. Both resolve to the same (merchant, service)
 * row and return the same payload.
 */
class ServiceInstallationController extends Controller
{
    use ApiResponse;

    public function show(ServiceSubscription $serviceSubscription)
    {
        $installation = $serviceSubscription->resolveInstallation();

        // Null rather than 404: a comped or legacy subscription legitimately
        // has no installation yet, and the page renders a "schedule it" CTA.
        if (! $installation) {
            return $this->successResponse(null, 'No installation yet');
        }

        return $this->successResponse(
            new ServiceInstallationResource($this->loaded($installation)),
            'Installation retrieved successfully'
        );
    }

    public function upsert(
        UpsertServiceInstallationRequest $request,
        ServiceSubscription $serviceSubscription,
        UpsertServiceInstallationAction $action
    ) {
        $installation = $action->execute(
            InstallationTargetDTO::fromSubscription($serviceSubscription),
            $request->validated(),
        );

        return $this->successResponse(
            new ServiceInstallationResource($this->loaded($installation)),
            'Jadwal instalasi berhasil disimpan'
        );
    }

    /** Same payload as show(), reached before any subscription exists. */
    public function showForInvoice(ServiceInvoice $serviceInvoice)
    {
        $installation = $serviceInvoice->resolveInstallation();

        // Null rather than 404: "not prepared yet" is the normal state of a
        // fresh invoice, and the page renders a "Jadwalkan Instalasi" CTA.
        if (! $installation) {
            return $this->successResponse(null, 'No installation yet');
        }

        return $this->successResponse(
            new ServiceInstallationResource($this->loaded($installation)),
            'Installation retrieved successfully'
        );
    }

    public function upsertForInvoice(
        UpsertServiceInstallationRequest $request,
        ServiceInvoice $serviceInvoice,
        UpsertServiceInstallationAction $action
    ) {
        $installation = $action->execute(
            InstallationTargetDTO::fromInvoice($serviceInvoice),
            $request->validated(),
        );

        return $this->successResponse(
            new ServiceInstallationResource($this->loaded($installation)),
            'Jadwal instalasi berhasil disimpan'
        );
    }

    /**
     * The only path by which a secret's plaintext leaves the server. POST so it
     * is not proxy-cacheable and the id never lands in an access-log query
     * string; `no-store` so the browser does not keep it either.
     */
    public function reveal(ServiceInstallationDetail $serviceInstallationDetail)
    {
        return $this->successResponse([
            'id' => $serviceInstallationDetail->id,
            'value' => $serviceInstallationDetail->value,
        ], 'Value revealed')->header('Cache-Control', 'no-store');
    }

    private function loaded(ServiceInstallation $installation): ServiceInstallation
    {
        return $installation->load(['service:id,code,name', 'merchant:id,name', 'steps.completedBy:id,name', 'details']);
    }
}
