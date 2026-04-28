<?php

namespace App\Http\Controllers\Api\Category;

use App\Http\Controllers\Controller;
use App\Models\SubCategory;
use App\Traits\ApiResponse;
use App\Actions\Category\GetSubCategoriesAction;
use App\Actions\Category\CreateSubCategoryAction;
use App\Actions\Category\UpdateSubCategoryAction;
use App\Actions\Category\DeleteSubCategoryAction;
use App\Http\Requests\Category\StoreSubCategoryRequest;
use App\Http\Requests\Category\UpdateSubCategoryRequest;
use App\Http\Resources\Api\Category\SubCategoryResource;

class SubCategoryController extends Controller
{
    use ApiResponse;

    public function index(GetSubCategoriesAction $action)
    {
        $subCategories = $action->execute(15);
        
        return $this->successResponse([
            'data' => SubCategoryResource::collection($subCategories),
            'meta' => [
                'current_page' => $subCategories->currentPage(),
                'last_page' => $subCategories->lastPage(),
                'per_page' => $subCategories->perPage(),
                'total' => $subCategories->total(),
            ]
        ], 'Sub Categories retrieved successfully');
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
