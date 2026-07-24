<?php

namespace App\Http\Controllers\Api\Product;

use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DeleteProductAction;
use App\Actions\Product\GetProductsAction;
use App\Actions\Product\UpdateProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\Api\Product\ProductResource;
use App\Models\Product;
use App\Traits\ApiResponse;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(GetProductsAction $action)
    {
        $products = $action->execute(15);

        return $this->paginatedResponse(ProductResource::collection($products), 'Products retrieved successfully');
    }

    public function store(StoreProductRequest $request, CreateProductAction $action)
    {
        $product = $action->execute($request->toDTO());

        return $this->successResponse(
            new ProductResource($product->load(['category', 'subCategory'])),
            'Product created successfully',
            201
        );
    }

    public function show(Product $product)
    {
        return $this->successResponse(
            new ProductResource($product->load(['category', 'subCategory'])),
            'Product retrieved successfully'
        );
    }

    public function update(UpdateProductRequest $request, Product $product, UpdateProductAction $action)
    {
        $updatedProduct = $action->execute($product, $request->toDTO());

        return $this->successResponse(
            new ProductResource($updatedProduct->load(['category', 'subCategory'])),
            'Product updated successfully'
        );
    }

    public function destroy(Product $product, DeleteProductAction $action)
    {
        $action->execute($product);

        return $this->successResponse(null, 'Product deleted successfully');
    }
}
