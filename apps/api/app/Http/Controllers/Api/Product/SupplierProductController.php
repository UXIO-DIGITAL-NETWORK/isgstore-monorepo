<?php

namespace App\Http\Controllers\Api\Product;

use App\Actions\Product\BulkSupplierProductAction;
use App\Actions\Product\CreateSupplierProductAction;
use App\Actions\Product\DeleteSupplierProductAction;
use App\Actions\Product\GetSupplierProductsAction;
use App\Actions\Product\LockSupplierProductPriceAction;
use App\Actions\Product\SetSupplierProductMarginAction;
use App\Actions\Product\UpdateSupplierProductAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\BulkDeleteSupplierProductsRequest;
use App\Http\Requests\Product\BulkLockSupplierProductPriceRequest;
use App\Http\Requests\Product\BulkSetSupplierProductMarginRequest;
use App\Http\Requests\Product\LockSupplierProductPriceRequest;
use App\Http\Requests\Product\SetSupplierProductMarginRequest;
use App\Http\Requests\Product\StoreSupplierProductRequest;
use App\Http\Requests\Product\UpdateSupplierProductRequest;
use App\Http\Resources\Api\Product\SupplierProductResource;
use App\Models\SupplierProduct;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SupplierProductController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetSupplierProductsAction $action)
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $products = $action->execute($perPage, $request->only(['search', 'supplier_id', 'category_id', 'status', 'mode']));

        return $this->paginatedResponse(SupplierProductResource::collection($products), 'Supplier Products retrieved successfully');
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
        if ($this->isSystem($supplierProduct)) {
            return $this->errorResponse('System provider products cannot be deleted.', 403);
        }

        $action->execute($supplierProduct);

        return $this->successResponse(null, 'Supplier Product deleted successfully');
    }

    public function lockPrice(LockSupplierProductPriceRequest $request, SupplierProduct $supplierProduct, LockSupplierProductPriceAction $action)
    {
        $updated = $action->execute($supplierProduct, (bool) $request->validated('locked'));

        return $this->successResponse(
            new SupplierProductResource($updated->load(['product', 'supplier'])),
            'Provider price lock updated successfully'
        );
    }

    public function setMargin(SetSupplierProductMarginRequest $request, SupplierProduct $supplierProduct, SetSupplierProductMarginAction $action)
    {
        $updated = $action->execute($supplierProduct, $request->margins());

        return $this->successResponse(
            new SupplierProductResource($updated->load(['product', 'supplier'])),
            'Profit margin updated successfully'
        );
    }

    public function bulkLockPrice(BulkLockSupplierProductPriceRequest $request, BulkSupplierProductAction $action)
    {
        $result = $action->lockPrice($request->validated('ids'), (bool) $request->validated('locked'));

        return $this->successResponse($result, 'Provider price locks updated successfully');
    }

    public function bulkSetMargin(BulkSetSupplierProductMarginRequest $request, BulkSupplierProductAction $action)
    {
        $result = $action->setMargin($request->validated('ids'), $request->margins());

        return $this->successResponse($result, 'Profit margins updated successfully');
    }

    public function bulkDelete(BulkDeleteSupplierProductsRequest $request, BulkSupplierProductAction $action)
    {
        $result = $action->delete($request->validated('ids'));

        return $this->successResponse($result, 'Provider products deleted successfully');
    }

    private function isSystem(SupplierProduct $supplierProduct): bool
    {
        return (bool) $supplierProduct->supplier?->is_system;
    }
}
