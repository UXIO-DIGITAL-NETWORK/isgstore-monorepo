<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\ServerCategoryOption\CreateServerCategoryOptionAction;
use App\Actions\Category\ServerCategoryOption\DeleteServerCategoryOptionAction;
use App\Actions\Category\ServerCategoryOption\GetServerCategoryOptionsAction;
use App\Actions\Category\ServerCategoryOption\UpdateServerCategoryOptionAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\ServerCategoryOption\StoreServerCategoryOptionRequest;
use App\Http\Requests\Category\ServerCategoryOption\UpdateServerCategoryOptionRequest;
use App\Http\Resources\Api\Category\ServerCategoryOption\ServerCategoryOptionResource;
use App\Models\ServerCategoryOption;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ServerCategoryOptionController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetServerCategoryOptionsAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $serverCategoryId = $request->query('server_category_id');

        $options = $action->execute(
            $perPage,
            $serverCategoryId !== null ? (int) $serverCategoryId : null,
            $request->query('search'),
        );

        return $this->paginatedResponse(ServerCategoryOptionResource::collection($options), 'Server Category Options retrieved successfully');
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
