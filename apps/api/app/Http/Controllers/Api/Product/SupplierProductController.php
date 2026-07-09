<?php

namespace App\Http\Controllers\Api\Product;

use App\Actions\Product\CreateSupplierProductAction;
use App\Actions\Product\DeleteSupplierProductAction;
use App\Actions\Product\GetSupplierProductsAction;
use App\Actions\Product\UpdateSupplierProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreSupplierProductRequest;
use App\Http\Requests\Product\UpdateSupplierProductRequest;
use App\Http\Resources\Api\Product\SupplierProductResource;
use App\Models\SupplierProduct;
use App\Traits\ApiResponse;

class SupplierProductController extends Controller
{
    use ApiResponse;

    public function index(GetSupplierProductsAction $action)
    {
        $products = $action->execute(15);

        return $this->successResponse([
            'data' => SupplierProductResource::collection($products),
            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ], 'Supplier Products retrieved successfully');
    }

    public function store(StoreSupplierProductRequest $request, CreateSupplierProductAction $action)
    {
        $supplierProduct = $action->execute($request->toDTO());

        return $this->successResponse(
            new SupplierProductResource($supplierProduct->load(['product', 'supplier'])),
            'Supplier Product created successfully',
            201
        );
    }

    public function show(SupplierProduct $supplierProduct)
    {
        return $this->successResponse(
            new SupplierProductResource($supplierProduct->load(['product', 'supplier'])),
            'Supplier Product retrieved successfully'
        );
    }

    public function update(UpdateSupplierProductRequest $request, SupplierProduct $supplierProduct, UpdateSupplierProductAction $action)
    {
        $updatedProduct = $action->execute($supplierProduct, $request->toDTO());

        return $this->successResponse(
            new SupplierProductResource($updatedProduct->load(['product', 'supplier'])),
            'Supplier Product updated successfully'
        );
    }

    public function destroy(SupplierProduct $supplierProduct, DeleteSupplierProductAction $action)
    {
        $action->execute($supplierProduct);

        return $this->successResponse(null, 'Supplier Product deleted successfully');
    }
}
