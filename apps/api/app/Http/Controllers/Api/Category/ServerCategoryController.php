<?php

namespace App\Http\Controllers\Api\Category;

use App\Http\Controllers\Controller;
use App\Models\ServerCategory;
use App\Traits\ApiResponse;
use App\Actions\Category\GetServerCategoriesAction;
use App\Actions\Category\CreateServerCategoryAction;
use App\Actions\Category\UpdateServerCategoryAction;
use App\Actions\Category\DeleteServerCategoryAction;
use App\Http\Requests\Category\StoreServerCategoryRequest;
use App\Http\Requests\Category\UpdateServerCategoryRequest;
use App\Http\Resources\Api\Category\ServerCategoryResource;

class ServerCategoryController extends Controller
{
    use ApiResponse;

    public function index(GetServerCategoriesAction $action)
    {
        $serverCategories = $action->execute(15);
        
        return $this->successResponse([
            'data' => ServerCategoryResource::collection($serverCategories),
            'meta' => [
                'current_page' => $serverCategories->currentPage(),
                'last_page' => $serverCategories->lastPage(),
                'per_page' => $serverCategories->perPage(),
                'total' => $serverCategories->total(),
            ]
        ], 'Server Categories retrieved successfully');
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
