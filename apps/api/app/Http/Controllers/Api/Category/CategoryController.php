<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\CreateCategoryAction;
use App\Actions\Category\DeleteCategoryAction;
use App\Actions\Category\GetCategoriesAction;
use App\Actions\Category\UpdateCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\Api\Category\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponse;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(GetCategoriesAction $action)
    {
        $categories = $action->execute(15);

        return $this->successResponse([
            'data' => CategoryResource::collection($categories),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
            ],
        ], 'Categories retrieved successfully');
    }

    public function store(StoreCategoryRequest $request, CreateCategoryAction $action)
    {
        $category = $action->execute($request->toDTO());

        return $this->successResponse(
            new CategoryResource($category->load('categoryType')),
            'Category created successfully',
            201
        );
    }

    public function show(Category $category)
    {
        return $this->successResponse(
            new CategoryResource($category->load('categoryType')),
            'Category retrieved successfully'
        );
    }

    public function update(UpdateCategoryRequest $request, Category $category, UpdateCategoryAction $action)
    {
        $updatedCategory = $action->execute($category, $request->toDTO());

        return $this->successResponse(
            new CategoryResource($updatedCategory->load('categoryType')),
            'Category updated successfully'
        );
    }

    public function destroy(Category $category, DeleteCategoryAction $action)
    {
        $action->execute($category);

        return $this->successResponse(null, 'Category deleted successfully');
    }
}
