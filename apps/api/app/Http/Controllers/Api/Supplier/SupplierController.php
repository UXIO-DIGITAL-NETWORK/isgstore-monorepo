<?php

namespace App\Http\Controllers\Api\Supplier;

use App\Actions\Supplier\CreateSupplierAction;
use App\Actions\Supplier\DeleteSupplierAction;
use App\Actions\Supplier\GetSuppliersAction;
use App\Actions\Supplier\UpdateSupplierAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\Api\Supplier\SupplierResource;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    use ApiResponse;

    public function index(Request $request, GetSuppliersAction $action)
    {
        $suppliers = $action->execute(
            min(100, max(1, (int) $request->query('per_page', 15))),
            $request->query('search')
        );

        return $this->successResponse([
            'data' => SupplierResource::collection($suppliers),
            'meta' => [
                'current_page' => $suppliers->currentPage(),
                'last_page' => $suppliers->lastPage(),
                'per_page' => $suppliers->perPage(),
                'total' => $suppliers->total(),
            ],
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
