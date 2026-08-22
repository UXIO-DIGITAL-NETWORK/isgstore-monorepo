<?php

namespace App\Http\Controllers\Api\Product;

use App\Actions\Product\BulkCreateProductsAction;
use App\Actions\Product\BulkProductAction;
use App\Actions\Product\CreateProductAction;
use App\Actions\Product\DeleteProductAction;
use App\Actions\Product\GetProductsAction;
use App\Actions\Product\ProductPriceControlAction;
use App\Actions\Product\UpdateProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\BulkCreateProductsRequest;
use App\Http\Requests\Product\BulkProductActionRequest;
use App\Http\Requests\Product\SetProductPriceLimitRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\Api\Product\ProductResource;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetProductsAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $categoryId = $request->query('category_id');
        $subCategoryId = $request->query('sub_category_id');
        $status = $request->query('status');
        $minPrice = $request->query('min_price');
        $maxPrice = $request->query('max_price');

        $products = $action->execute(
            $perPage,
            $request->query('search'),
            $categoryId !== null ? (int) $categoryId : null,
            $subCategoryId !== null ? (int) $subCategoryId : null,
            $status !== null ? filter_var($status, FILTER_VALIDATE_BOOLEAN) : null,
            $minPrice !== null ? (int) $minPrice : null,
            $maxPrice !== null ? (int) $maxPrice : null,
        );

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

    // ── Price controls ─────────────────────────────────────────────────────────

    public function setPriceLimit(SetProductPriceLimitRequest $request, Product $product, ProductPriceControlAction $action)
    {
        $updated = $action->setLimit($product, $request->priceMin(), $request->priceMax());

        return $this->successResponse(
            new ProductResource($updated->load(['category', 'subCategory'])),
            'Price limit updated successfully'
        );
    }

    public function bulkLockPrice(BulkProductActionRequest $request, BulkProductAction $action)
    {
        return $this->successResponse(
            $action->lock($request->validated('ids'), (bool) $request->boolean('locked')),
            'Product price locks updated successfully'
        );
    }

    public function bulkShowPrice(BulkProductActionRequest $request, BulkProductAction $action)
    {
        // The client sends `hidden`: "Show Price" posts false, "Hide" posts true.
        return $this->successResponse(
            $action->hide($request->validated('ids'), $request->boolean('hidden')),
            'Product price visibility updated successfully'
        );
    }

    public function bulkDeactivate(BulkProductActionRequest $request, BulkProductAction $action)
    {
        return $this->successResponse(
            $action->deactivate($request->validated('ids')),
            'Products deactivated successfully'
        );
    }

    public function bulkUxiotopupUpdate(BulkProductActionRequest $request, BulkProductAction $action)
    {
        return $this->successResponse(
            $action->uxiotopupUpdate($request->validated('ids')),
            'Products updated from supplier successfully'
        );
    }

    public function bulkDelete(BulkProductActionRequest $request, BulkProductAction $action)
    {
        return $this->successResponse(
            $action->delete($request->validated('ids')),
            'Products deleted successfully'
        );
    }

    /** Add Product (Bulk): create many products from a supplier + category. */
    public function bulkCreate(BulkCreateProductsRequest $request, BulkCreateProductsAction $action)
    {
        $result = $action->execute(
            (int) $request->validated('supplier_id'),
            (int) $request->validated('category_id'),
            $request->items(),
        );

        return $this->successResponse($result, 'Products created successfully', 201);
    }
}
