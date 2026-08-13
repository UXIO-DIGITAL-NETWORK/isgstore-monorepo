<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Installation\CreateInstallationStepAction;
use App\Actions\Installation\DeleteInstallationStepAction;
use App\Actions\Installation\SetInstallationStepCompletionAction;
use App\Actions\Installation\UpdateInstallationStepAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Installation\SetStepCompletionRequest;
use App\Http\Requests\Installation\StoreInstallationStepRequest;
use App\Http\Requests\Installation\UpdateInstallationStepRequest;
use App\Http\Resources\Api\Service\ServiceInstallationStepResource;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationStep;
use App\Traits\ApiResponse;

/** The installation checklist — the only source of truth for progress. */
class ServiceInstallationStepController extends Controller
{
    use ApiResponse;

    public function store(StoreInstallationStepRequest $request, ServiceInstallation $serviceInstallation, CreateInstallationStepAction $action)
    {
        $step = $action->execute($serviceInstallation, $request->validated());

        return $this->successResponse(new ServiceInstallationStepResource($step), 'Tahapan berhasil ditambahkan', 201);
    }

    public function update(UpdateInstallationStepRequest $request, ServiceInstallationStep $serviceInstallationStep, UpdateInstallationStepAction $action)
    {
        $updated = $action->execute($serviceInstallationStep, $request->validated());

        return $this->successResponse(new ServiceInstallationStepResource($updated), 'Tahapan berhasil diperbarui');
    }

    public function setCompletion(SetStepCompletionRequest $request, ServiceInstallationStep $serviceInstallationStep, SetInstallationStepCompletionAction $action)
    {
        $updated = $action->execute(
            $serviceInstallationStep,
            (bool) $request->validated()['completed'],
            $request->user(),
        );

        return $this->successResponse(
            new ServiceInstallationStepResource($updated->load('completedBy:id,name')),
            'Status tahapan diperbarui'
        );
    }

    public function destroy(ServiceInstallationStep $serviceInstallationStep, DeleteInstallationStepAction $action)
    {
        $action->execute($serviceInstallationStep);

        return $this->successResponse(null, 'Tahapan berhasil dihapus');
    }
}
