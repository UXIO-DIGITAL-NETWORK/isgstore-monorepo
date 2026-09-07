<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\CreateCategoryAction;
use App\Actions\Category\DeleteCategoryAction;
use App\Actions\Category\GetCategoriesAction;
use App\Actions\Category\SetCategoryStatusAction;
use App\Actions\Category\UpdateCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\SetCategoryStatusRequest;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\Api\Category\CategoryResource;
use App\Models\Category;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetCategoriesAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $typeId = $request->query('type_id');

        $categories = $action->execute(
            $perPage,
            $request->query('search'),
            $typeId !== null ? (int) $typeId : null
        );

        return $this->paginatedResponse(CategoryResource::collection($categories), 'Categories retrieved successfully');
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

    public function setStatus(SetCategoryStatusRequest $request, Category $category, SetCategoryStatusAction $action)
    {
        $category = $action->execute($category, $request->boolean('status'));

        return $this->successResponse(
            new CategoryResource($category->load('categoryType')),
            'Category status updated successfully'
        );
    }

    public function destroy(Category $category, DeleteCategoryAction $action)
    {
        $action->execute($category);

        return $this->successResponse(null, 'Category deleted successfully');
    }
}
