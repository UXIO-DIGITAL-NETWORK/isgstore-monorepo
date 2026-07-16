<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\CategoryType\CreateCategoryTypeAction;
use App\Actions\Category\CategoryType\DeleteCategoryTypeAction;
use App\Actions\Category\CategoryType\GetCategoryTypesAction;
use App\Actions\Category\CategoryType\UpdateCategoryTypeAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\CategoryType\StoreCategoryTypeRequest;
use App\Http\Requests\Category\CategoryType\UpdateCategoryTypeRequest;
use App\Http\Resources\Api\Category\CategoryType\CategoryTypeResource;
use App\Models\CategoryType;
use App\Traits\ApiResponse;

class CategoryTypeController extends Controller
{
    use ApiResponse;

    public function index(GetCategoryTypesAction $action)
    {
        $types = $action->execute(15);

        return $this->paginatedResponse(CategoryTypeResource::collection($types), 'Category Types retrieved successfully');
    }

    public function store(StoreCategoryTypeRequest $request, CreateCategoryTypeAction $action)
    {
        $type = $action->execute($request->toDTO());

        return $this->successResponse(
            new CategoryTypeResource($type),
            'Category Type created successfully',
            201
        );
    }

    public function show(CategoryType $categoryType)
    {
        return $this->successResponse(
            new CategoryTypeResource($categoryType),
            'Category Type retrieved successfully'
        );
    }

    public function update(UpdateCategoryTypeRequest $request, CategoryType $categoryType, UpdateCategoryTypeAction $action)
    {
        $type = $action->execute($categoryType, $request->toDTO());

        return $this->successResponse(
            new CategoryTypeResource($type),
            'Category Type updated successfully'
        );
    }

    public function destroy(CategoryType $categoryType, DeleteCategoryTypeAction $action)
    {
        $action->execute($categoryType);

        return $this->successResponse(null, 'Category Type deleted successfully');
    }
}
