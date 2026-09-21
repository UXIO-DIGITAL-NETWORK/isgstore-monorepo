<?php

namespace App\Http\Controllers\Api\Hub;

use App\Actions\Installation\CreateInstallationStepAction;
use App\Actions\Installation\DeleteInstallationDetailAction;
use App\Actions\Installation\DeleteInstallationStepAction;
use App\Actions\Installation\SetInstallationStepCompletionAction;
use App\Actions\Installation\UpdateInstallationStepAction;
use App\Actions\Installation\UpsertInstallationDetailAction;
use App\Actions\Installation\UpsertServiceInstallationAction;
use App\DTOs\Installation\InstallationTargetDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Installation\SetStepCompletionRequest;
use App\Http\Requests\Installation\StoreInstallationDetailRequest;
use App\Http\Requests\Installation\StoreInstallationStepRequest;
use App\Http\Requests\Installation\UpdateInstallationDetailRequest;
use App\Http\Requests\Installation\UpdateInstallationStepRequest;
use App\Http\Requests\Installation\UpsertServiceInstallationRequest;
use App\Http\Resources\Api\Service\ServiceInstallationDetailResource;
use App\Http\Resources\Api\Service\ServiceInstallationResource;
use App\Http\Resources\Api\Service\ServiceInstallationStepResource;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Models\ServiceInstallationStep;
use App\Support\Hub\HubSystemUser;
use App\Support\Payment\DefaultMerchant;
use App\Traits\ApiResponse;

/**
 * The installation surface the Uxio Hub drives (gated by `hub` + `hub-write` —
 * read key AND a separate write key). Each method wraps the SAME Action the
 * payment-internal panel uses, so the business logic is never forked; step
 * completion is attributed to the HubSystemUser, since a Hub request carries no
 * authenticated user. Every mutation here is REACHED by the Hub only to edit an
 * installation the site already created (confirmation owns creation).
 *
 * Ownership is re-checked in every method against the default merchant — one
 * site holds one owner — answering 404 rather than 403 so another merchant's ids
 * can never be probed.
 */
class HubInstallationController extends Controller
{
    use ApiResponse;

    public function updateWindow(
        UpsertServiceInstallationRequest $request,
        ServiceInstallation $installation,
        UpsertServiceInstallationAction $action
    ) {
        $this->assertOwned($installation);

        $updated = $action->execute(
            new InstallationTargetDTO(
                merchantId: (int) $installation->merchant_id,
                serviceId: (int) $installation->service_id,
            ),
            $request->validated(),
        );

        return $this->successResponse(
            new ServiceInstallationResource($this->loaded($updated)),
            'Jadwal instalasi berhasil disimpan'
        );
    }

    public function storeStep(
        StoreInstallationStepRequest $request,
        ServiceInstallation $installation,
        CreateInstallationStepAction $action
    ) {
        $this->assertOwned($installation);

        $step = $action->execute($installation, $request->validated());

        return $this->successResponse(new ServiceInstallationStepResource($step), 'Tahapan berhasil ditambahkan', 201);
    }

    public function updateStep(
        UpdateInstallationStepRequest $request,
        ServiceInstallationStep $serviceInstallationStep,
        UpdateInstallationStepAction $action
    ) {
        $this->assertOwnedStep($serviceInstallationStep);

        $updated = $action->execute($serviceInstallationStep, $request->validated());

        return $this->successResponse(new ServiceInstallationStepResource($updated), 'Tahapan berhasil diperbarui');
    }

    public function setStepCompletion(
        SetStepCompletionRequest $request,
        ServiceInstallationStep $serviceInstallationStep,
        SetInstallationStepCompletionAction $action
    ) {
        $this->assertOwnedStep($serviceInstallationStep);

        $updated = $action->execute(
            $serviceInstallationStep,
            (bool) $request->validated()['completed'],
            HubSystemUser::resolve(),
        );

        return $this->successResponse(
            new ServiceInstallationStepResource($updated->load('completedBy:id,name')),
            'Status tahapan diperbarui'
        );
    }

    public function destroyStep(
        ServiceInstallationStep $serviceInstallationStep,
        DeleteInstallationStepAction $action
    ) {
        $this->assertOwnedStep($serviceInstallationStep);

        $action->execute($serviceInstallationStep);

        return $this->successResponse(null, 'Tahapan berhasil dihapus');
    }

    public function storeDetail(
        StoreInstallationDetailRequest $request,
        ServiceInstallation $installation,
        UpsertInstallationDetailAction $action
    ) {
        $this->assertOwned($installation);

        $detail = $action->create($installation, $request->validated());

        return $this->successResponse(new ServiceInstallationDetailResource($detail), 'Detail berhasil ditambahkan', 201);
    }

    public function updateDetail(
        UpdateInstallationDetailRequest $request,
        ServiceInstallationDetail $serviceInstallationDetail,
        UpsertInstallationDetailAction $action
    ) {
        $this->assertOwnedDetail($serviceInstallationDetail);

        $updated = $action->update($serviceInstallationDetail, $request->validated());

        return $this->successResponse(new ServiceInstallationDetailResource($updated), 'Detail berhasil diperbarui');
    }

    public function destroyDetail(
        ServiceInstallationDetail $serviceInstallationDetail,
        DeleteInstallationDetailAction $action
    ) {
        $this->assertOwnedDetail($serviceInstallationDetail);

        $action->execute($serviceInstallationDetail);

        return $this->successResponse(null, 'Detail berhasil dihapus');
    }

    /**
     * The only path by which a secret's plaintext leaves the server, and the Hub
     * never stores the answer — it passes it straight to the operator and audits
     * the act on its own side. POST so it is not proxy-cacheable and the id never
     * lands in an access-log query string; `no-store` so the browser keeps it too.
     */
    public function revealDetail(ServiceInstallationDetail $serviceInstallationDetail)
    {
        $this->assertOwnedDetail($serviceInstallationDetail);

        return $this->successResponse([
            'id' => $serviceInstallationDetail->id,
            'value' => $serviceInstallationDetail->value,
        ], 'Value revealed')->header('Cache-Control', 'no-store');
    }

    private function assertOwned(ServiceInstallation $installation): void
    {
        abort_unless($installation->merchant_id === DefaultMerchant::id(), 404);
    }

    private function assertOwnedStep(ServiceInstallationStep $step): void
    {
        abort_unless($step->installation?->merchant_id === DefaultMerchant::id(), 404);
    }

    private function assertOwnedDetail(ServiceInstallationDetail $detail): void
    {
        abort_unless($detail->installation?->merchant_id === DefaultMerchant::id(), 404);
    }

    private function loaded(ServiceInstallation $installation): ServiceInstallation
    {
        return $installation->load([
            'service:id,code,name',
            'merchant:id,name',
            'steps.completedBy:id,name',
            'details',
        ]);
    }
}
