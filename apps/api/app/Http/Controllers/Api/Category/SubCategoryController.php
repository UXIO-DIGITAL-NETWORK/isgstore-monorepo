<?php

namespace App\Http\Controllers\Api\Category;

use App\Actions\Category\GetSubCategoriesAction;
use App\Actions\Category\SubCategory\CreateSubCategoryAction;
use App\Actions\Category\SubCategory\DeleteSubCategoryAction;
use App\Actions\Category\SubCategory\UpdateSubCategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\SubCategory\StoreSubCategoryRequest;
use App\Http\Requests\Category\SubCategory\UpdateSubCategoryRequest;
use App\Http\Resources\Api\Category\SubCategory\SubCategoryResource;
use App\Models\SubCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SubCategoryController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetSubCategoriesAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $categoryId = $request->query('category_id');
        $subCategories = $action->execute(
            $perPage,
            $categoryId !== null ? (int) $categoryId : null,
            $request->query('search'),
        );

        return $this->paginatedResponse(SubCategoryResource::collection($subCategories), 'Sub Categories retrieved successfully');
    }

    public function store(StoreSubCategoryRequest $request, CreateSubCategoryAction $action)
    {
        $subCategory = $action->execute($request->toDTO());

        return $this->successResponse(
            new SubCategoryResource($subCategory->load('category')),
            'Sub Category created successfully',
            201
        );
    }

    public function show(SubCategory $subCategory)
    {
        return $this->successResponse(
            new SubCategoryResource($subCategory->load('category')),
            'Sub Category retrieved successfully'
        );
    }

    public function update(UpdateSubCategoryRequest $request, SubCategory $subCategory, UpdateSubCategoryAction $action)
    {
        $updatedSubCategory = $action->execute($subCategory, $request->toDTO());

        return $this->successResponse(
            new SubCategoryResource($updatedSubCategory->load('category')),
            'Sub Category updated successfully'
        );
    }

    public function destroy(SubCategory $subCategory, DeleteSubCategoryAction $action)
    {
        $action->execute($subCategory);

        return $this->successResponse(null, 'Sub Category deleted successfully');
    }
}
