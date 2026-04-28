<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Http\Controllers\Controller;
use App\Models\SupplierCategory;
use App\Traits\ApiResponse;
use App\Actions\Supplier\GetSupplierCategoriesAction;
use App\Actions\Supplier\CreateSupplierCategoryAction;
use App\Actions\Supplier\UpdateSupplierCategoryAction;
use App\Actions\Supplier\DeleteSupplierCategoryAction;
use App\Http\Requests\Supplier\StoreSupplierCategoryRequest;
use App\Http\Requests\Supplier\UpdateSupplierCategoryRequest;
use App\Http\Resources\Api\Supplier\SupplierCategoryResource;

class SupplierCategoryController extends Controller
{
    use ApiResponse;

    public function index(GetSupplierCategoriesAction $action)
    {
        $categories = $action->execute(15);
        
        return $this->successResponse([
            'data' => SupplierCategoryResource::collection($categories),
            'meta' => [
                'current_page' => $categories->currentPage(),
                'last_page' => $categories->lastPage(),
                'per_page' => $categories->perPage(),
                'total' => $categories->total(),
            ]
        ], 'Supplier Categories retrieved successfully');
    }

    public function store(StoreSupplierCategoryRequest $request, CreateSupplierCategoryAction $action)
    {
        $supplierCategory = $action->execute($request->toDTO());

        return $this->successResponse(
            new SupplierCategoryResource($supplierCategory->load(['category', 'supplier'])),
            'Supplier Category created successfully',
            201
        );
    }

    public function show(SupplierCategory $supplierCategory)
    {
        return $this->successResponse(
            new SupplierCategoryResource($supplierCategory->load(['category', 'supplier'])),
            'Supplier Category retrieved successfully'
        );
    }

    public function update(UpdateSupplierCategoryRequest $request, SupplierCategory $supplierCategory, UpdateSupplierCategoryAction $action)
    {
        $updatedCategory = $action->execute($supplierCategory, $request->toDTO());

        return $this->successResponse(
            new SupplierCategoryResource($updatedCategory->load(['category', 'supplier'])),
            'Supplier Category updated successfully'
        );
    }

    public function destroy(SupplierCategory $supplierCategory, DeleteSupplierCategoryAction $action)
    {
        $action->execute($supplierCategory);

        return $this->successResponse(null, 'Supplier Category deleted successfully');
    }
}
