<?php

namespace App\Http\Controllers\Api\Finance;

use App\Actions\Installation\DeleteInstallationDetailAction;
use App\Actions\Installation\UpsertInstallationDetailAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Installation\StoreInstallationDetailRequest;
use App\Http\Requests\Installation\UpdateInstallationDetailRequest;
use App\Http\Resources\Api\Service\ServiceInstallationDetailResource;
use App\Models\ServiceInstallation;
use App\Models\ServiceInstallationDetail;
use App\Traits\ApiResponse;

/**
 * The data kita hands over — usernames, endpoints, API keys.
 *
 * Every response goes through the masking resource, so the value just written
 * is not echoed back in the clear.
 */
class ServiceInstallationDetailController extends Controller
{
    use ApiResponse;

    public function store(StoreInstallationDetailRequest $request, ServiceInstallation $serviceInstallation, UpsertInstallationDetailAction $action)
    {
        $detail = $action->create($serviceInstallation, $request->validated());

        return $this->successResponse(new ServiceInstallationDetailResource($detail), 'Detail berhasil ditambahkan', 201);
    }

    public function update(UpdateInstallationDetailRequest $request, ServiceInstallationDetail $serviceInstallationDetail, UpsertInstallationDetailAction $action)
    {
        $updated = $action->update($serviceInstallationDetail, $request->validated());

        return $this->successResponse(new ServiceInstallationDetailResource($updated), 'Detail berhasil diperbarui');
    }

    public function destroy(ServiceInstallationDetail $serviceInstallationDetail, DeleteInstallationDetailAction $action)
    {
        $action->execute($serviceInstallationDetail);

        return $this->successResponse(null, 'Detail berhasil dihapus');
    }
}
