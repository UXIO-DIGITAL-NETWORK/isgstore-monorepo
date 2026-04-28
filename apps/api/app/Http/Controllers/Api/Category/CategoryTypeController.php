<?php

namespace App\Http\Controllers\Api\Category;

use App\Http\Controllers\Controller;
use App\Models\CategoryType;
use App\Traits\ApiResponse;
use App\Actions\Category\GetCategoryTypesAction;
use App\Actions\Category\CreateCategoryTypeAction;
use App\Actions\Category\UpdateCategoryTypeAction;
use App\Actions\Category\DeleteCategoryTypeAction;
use App\Http\Requests\Category\StoreCategoryTypeRequest;
use App\Http\Requests\Category\UpdateCategoryTypeRequest;
use App\Http\Resources\Api\Category\CategoryTypeResource;

class CategoryTypeController extends Controller
{
    use ApiResponse;

    public function index(GetCategoryTypesAction $action)
    {
        $types = $action->execute(15);
        
        return $this->successResponse([
            'data' => CategoryTypeResource::collection($types),
            'meta' => [
                'current_page' => $types->currentPage(),
                'last_page' => $types->lastPage(),
                'per_page' => $types->perPage(),
                'total' => $types->total(),
            ]
        ], 'Category Types retrieved successfully');
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
