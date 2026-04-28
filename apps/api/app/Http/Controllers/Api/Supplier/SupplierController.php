<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use App\Actions\Supplier\GetSuppliersAction;
use App\Actions\Supplier\CreateSupplierAction;
use App\Actions\Supplier\UpdateSupplierAction;
use App\Actions\Supplier\DeleteSupplierAction;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\Api\Supplier\SupplierResource;

class SupplierController extends Controller
{
    use ApiResponse;

    public function index(GetSuppliersAction $action)
    {
        $suppliers = $action->execute(15);
        
        return $this->successResponse([
            'data' => SupplierResource::collection($suppliers),
            'meta' => [
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
            ]
        ], 'Suppliers retrieved successfully');
    }

    public function store(StoreSupplierRequest $request, CreateSupplierAction $action)
    {
        $supplier = $action->execute($request->toDTO());

        return $this->successResponse(
            new SupplierResource($supplier),
            'Supplier created successfully',
            201
        );
    }

    public function show(Supplier $supplier)
    {
        return $this->successResponse(
            new SupplierResource($supplier),
            'Supplier retrieved successfully'
        );
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier, UpdateSupplierAction $action)
    {
        $updatedSupplier = $action->execute($supplier, $request->toDTO());

        return $this->successResponse(
            new SupplierResource($updatedSupplier),
            'Supplier updated successfully'
        );
    }

    public function destroy(Supplier $supplier, DeleteSupplierAction $action)
    {
        $action->execute($supplier);

        return $this->successResponse(null, 'Supplier deleted successfully');
    }
}
