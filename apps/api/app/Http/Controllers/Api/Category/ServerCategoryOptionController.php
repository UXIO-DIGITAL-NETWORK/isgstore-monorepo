<?php

namespace App\Http\Controllers\Api\Category;

use App\Http\Controllers\Controller;
use App\Models\ServerCategoryOption;
use App\Traits\ApiResponse;
use App\Actions\Category\GetServerCategoryOptionsAction;
use App\Actions\Category\CreateServerCategoryOptionAction;
use App\Actions\Category\UpdateServerCategoryOptionAction;
use App\Actions\Category\DeleteServerCategoryOptionAction;
use App\Http\Requests\Category\StoreServerCategoryOptionRequest;
use App\Http\Requests\Category\UpdateServerCategoryOptionRequest;
use App\Http\Resources\Api\Category\ServerCategoryOptionResource;

class ServerCategoryOptionController extends Controller
{
    use ApiResponse;

    public function index(GetServerCategoryOptionsAction $action)
    {
        $options = $action->execute(15);
        
        return $this->successResponse([
            'data' => ServerCategoryOptionResource::collection($options),
            'meta' => [
                'current_page' => $options->currentPage(),
                'last_page' => $options->lastPage(),
                'per_page' => $options->perPage(),
                'total' => $options->total(),
            ]
        ], 'Server Category Options retrieved successfully');
    }

    public function store(StoreServerCategoryOptionRequest $request, CreateServerCategoryOptionAction $action)
    {
        $option = $action->execute($request->toDTO());

        return $this->successResponse(
            new ServerCategoryOptionResource($option->load('serverCategory')),
            'Server Category Option created successfully',
            201
        );
    }

    public function show(ServerCategoryOption $serverCategoryOption)
    {
        return $this->successResponse(
            new ServerCategoryOptionResource($serverCategoryOption->load('serverCategory')),
            'Server Category Option retrieved successfully'
        );
    }

    public function update(UpdateServerCategoryOptionRequest $request, ServerCategoryOption $serverCategoryOption, UpdateServerCategoryOptionAction $action)
    {
        $updatedOption = $action->execute($serverCategoryOption, $request->toDTO());

        return $this->successResponse(
            new ServerCategoryOptionResource($updatedOption->load('serverCategory')),
            'Server Category Option updated successfully'
        );
    }

    public function destroy(ServerCategoryOption $serverCategoryOption, DeleteServerCategoryOptionAction $action)
    {
        $action->execute($serverCategoryOption);

        return $this->successResponse(null, 'Server Category Option deleted successfully');
    }
}
