<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\GetServerCategoriesAction;
use App\Actions\Category\ServerCategory\CreateServerCategoryAction;
use App\Actions\Category\ServerCategory\DeleteServerCategoryAction;
use App\Actions\Category\ServerCategory\UpdateServerCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\ServerCategory\StoreServerCategoryRequest;
use App\Http\Requests\Category\ServerCategory\UpdateServerCategoryRequest;
use App\Http\Resources\Api\Category\ServerCategory\ServerCategoryResource;
use App\Models\ServerCategory;
use App\Traits\ApiResponse;

class ServerCategoryController extends Controller
{
    use ApiResponse;

    public function index(GetServerCategoriesAction $action)
    {
        $serverCategories = $action->execute(15);

        return $this->paginatedResponse(ServerCategoryResource::collection($serverCategories), 'Server Categories retrieved successfully');
    }

    public function store(StoreServerCategoryRequest $request, CreateServerCategoryAction $action)
    {
        $serverCategory = $action->execute($request->toDTO());

        return $this->successResponse(
            new ServerCategoryResource($serverCategory->load('category')),
            'Server Category created successfully',
            201
        );
    }

    public function show(ServerCategory $serverCategory)
    {
        return $this->successResponse(
            new ServerCategoryResource($serverCategory->load('category')),
            'Server Category retrieved successfully'
        );
    }

    public function update(UpdateServerCategoryRequest $request, ServerCategory $serverCategory, UpdateServerCategoryAction $action)
    {
        $updatedServerCategory = $action->execute($serverCategory, $request->toDTO());

        return $this->successResponse(
            new ServerCategoryResource($updatedServerCategory->load('category')),
            'Server Category updated successfully'
        );
    }

    public function destroy(ServerCategory $serverCategory, DeleteServerCategoryAction $action)
    {
        $action->execute($serverCategory);

        return $this->successResponse(null, 'Server Category deleted successfully');
    }
}
